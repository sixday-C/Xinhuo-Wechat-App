#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
语音处理后端服务
集成pydub VAD和SiliconFlow API，提供VAD（语音活动检测）和ASR（自动语音识别）服务
基于refine.py的SiliconFlow API实现
"""

import os
import io
import json
import logging
import tempfile
import traceback
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from pydub import AudioSegment
from pydub.silence import detect_nonsilent

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('voice_server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# SiliconFlow API配置
SILICONFLOW_API_KEY = "sk-ztnkpylbyszrjrsttutrznsyewwlvotrdmkbtblpwommdswx"
SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/audio/transcriptions"
DEFAULT_MODEL = "FunAudioLLM/SenseVoiceSmall"

class VoiceProcessor:
    """语音处理器 - 集成pydub VAD和SiliconFlow ASR功能"""
    
    def __init__(self):
        self.api_key = SILICONFLOW_API_KEY
        self.api_url = SILICONFLOW_API_URL
        self.model_name = DEFAULT_MODEL
        logger.info("SiliconFlow语音处理器初始化完成")
    
    def ms_to_srt_timestamp(self, ms):
        """毫秒转换为SRT时间戳格式"""
        hours = ms // (3600 * 1000)
        minutes = (ms % (3600 * 1000)) // (60 * 1000)
        seconds = (ms % (60 * 1000)) // 1000
        milliseconds = ms % 1000
        return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"
    
    def vad_cut_audio(self, audio_data: bytes, min_silence_len: int = 500, 
                     silence_thresh: int = -40, min_chunk_length: int = 100, 
                     max_chunk_length: int = 50000) -> List[Dict]:
        """
        使用pydub进行VAD切割（基于refine.py实现）
        
        Args:
            audio_data: 音频字节数据
            min_silence_len: 最小静音长度(ms)
            silence_thresh: 静音阈值(dB)
            min_chunk_length: 最小片段长度(ms)
            max_chunk_length: 最大片段长度(ms)
            
        Returns:
            切割后的音频片段信息列表
        """
        try:
            # 使用pydub加载音频
            audio = AudioSegment.from_file(io.BytesIO(audio_data))
            
            # 检测非静音片段
            speech_chunks = detect_nonsilent(audio, min_silence_len, silence_thresh)
            
            chunks_data = []
            temp_dir = tempfile.mkdtemp(prefix="voice_chunks_")
            
            for i, (start_ms, end_ms) in enumerate(speech_chunks):
                if end_ms - start_ms < min_chunk_length:
                    continue
                
                # 处理过长片段，强制分割
                chunk_start = start_ms
                chunk_index = 0
                while chunk_start < end_ms:
                    chunk_end = min(chunk_start + max_chunk_length, end_ms)
                    chunk = audio[chunk_start:chunk_end]
                    
                    # 保存音频片段
                    chunk_filename = f"chunk_{i}_{chunk_index}.wav"
                    chunk_path = os.path.join(temp_dir, chunk_filename)
                    chunk.export(chunk_path, format="wav")
                    
                    chunks_data.append({
                        "start_time": chunk_start,
                        "end_time": chunk_end,
                        "file_path": chunk_path,
                        "confidence": 0.9,
                        "type": "speech"
                    })
                    
                    chunk_start = chunk_end
                    chunk_index += 1
            
            logger.info(f"VAD切割完成，共检测到 {len(chunks_data)} 个语音片段")
            return chunks_data
            
        except Exception as e:
            logger.error(f"VAD切割失败: {str(e)}")
            raise
    
    def transcribe_chunk_siliconflow(self, file_path: str, retries: int = 3, 
                                   wait_seconds: int = 5) -> str:
        """
        使用SiliconFlow API转录单个音频片段（基于refine.py实现）
        
        Args:
            file_path: 音频文件路径
            retries: 重试次数
            wait_seconds: 重试等待时间
            
        Returns:
            转录文本
        """
        headers = {
            'Authorization': f'Bearer {self.api_key}',
        }
        params = {'model': self.model_name}
        
        for attempt in range(1, retries + 1):
            try:
                logger.info(f"正在转录文件 {file_path}，尝试第 {attempt} 次...")
                
                with open(file_path, 'rb') as audio_file:
                    files = {'file': audio_file}
                    response = requests.post(
                        self.api_url, 
                        headers=headers, 
                        files=files, 
                        params=params, 
                        timeout=60
                    )
                    response.raise_for_status()
                    
                    result = response.json()
                    transcription = result.get("text", "")
                    
                    logger.info(f"转录成功: {file_path} -> {transcription[:50]}...")
                    return transcription
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"转录失败: {file_path}, 错误信息: {e}")
                if attempt < retries:
                    logger.info(f"等待 {wait_seconds} 秒后重试...")
                    time.sleep(wait_seconds)
                else:
                    logger.error("重试次数已用完，转录失败")
                    raise
        
        return ""
    
    def process_audio_concurrent(self, audio_data: bytes, max_workers: int = 4) -> Dict:
        """
        并发处理音频：VAD切割 + 并发ASR转录（基于refine.py实现）
        
        Args:
            audio_data: 音频字节数据
            max_workers: 最大并发数
            
        Returns:
            处理结果字典
        """
        try:
            start_time = datetime.now()
            
            # Step 1: VAD切割
            logger.info("开始VAD切割...")
            chunks_data = self.vad_cut_audio(audio_data)
            
            if not chunks_data:
                return {
                    'success': False,
                    'message': '未检测到有效语音片段',
                    'voice_segments': [],
                    'asr_results': [],
                    'full_text': '',
                    'overall_confidence': 0.0
                }
            
            # Step 2: 并发ASR转录
            logger.info(f"开始并发转录 {len(chunks_data)} 个片段...")
            asr_results = [None] * len(chunks_data)
            
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # 提交所有转录任务
                future_to_index = {
                    executor.submit(self.transcribe_chunk_siliconflow, chunk["file_path"]): idx 
                    for idx, chunk in enumerate(chunks_data)
                }
                
                # 收集结果
                for future in as_completed(future_to_index):
                    idx = future_to_index[future]
                    try:
                        transcription = future.result()
                        chunk = chunks_data[idx]
                        
                        asr_results[idx] = {
                            'text': transcription,
                            'confidence': 0.85,
                            'start_time': chunk['start_time'] / 1000.0,  # 转换为秒
                            'end_time': chunk['end_time'] / 1000.0,
                            'duration': (chunk['end_time'] - chunk['start_time']) / 1000.0
                        }
                        
                    except Exception as e:
                        logger.error(f"片段 {idx} 转录失败: {str(e)}")
                        chunk = chunks_data[idx]
                        asr_results[idx] = {
                            'text': '',
                            'confidence': 0.0,
                            'start_time': chunk['start_time'] / 1000.0,
                            'end_time': chunk['end_time'] / 1000.0,
                            'duration': (chunk['end_time'] - chunk['start_time']) / 1000.0,
                            'error': str(e)
                        }
            
            # Step 3: 清理临时文件
            for chunk in chunks_data:
                try:
                    os.unlink(chunk['file_path'])
                except:
                    pass
            
            # Step 4: 合并结果
            valid_results = [r for r in asr_results if r and r['text']]
            full_text = ' '.join([r['text'] for r in valid_results])
            avg_confidence = np.mean([r['confidence'] for r in valid_results]) if valid_results else 0.0
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            # 转换chunks_data为voice_segments格式
            voice_segments = [{
                'start_time': chunk['start_time'] / 1000.0,
                'end_time': chunk['end_time'] / 1000.0,
                'confidence': chunk['confidence'],
                'type': chunk['type']
            } for chunk in chunks_data]
            
            return {
                'success': True,
                'full_text': full_text,
                'overall_confidence': float(avg_confidence),
                'voice_segments': voice_segments,
                'asr_results': [r for r in asr_results if r],
                'processing_time': processing_time,
                'audio_duration': max([chunk['end_time'] for chunk in chunks_data]) / 1000.0 if chunks_data else 0,
                'timestamp': start_time.isoformat(),
                'method': 'siliconflow_api'
            }
            
        except Exception as e:
            logger.error(f"音频处理失败: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

# 全局语音处理器实例
voice_processor = VoiceProcessor()

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'vad': 'pydub VAD',
            'asr': 'SiliconFlow API',
            'api_url': SILICONFLOW_API_URL,
            'model': DEFAULT_MODEL
        }
    })

@app.route('/vad', methods=['POST'])
def voice_activity_detection():
    """VAD语音活动检测接口"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': '没有音频文件'}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': '音频文件名为空'}), 400
        
        # 读取音频数据
        audio_data = audio_file.read()
        
        # 使用VAD切割获取语音段
        chunks_data = voice_processor.vad_cut_audio(audio_data)
        
        # 转换为前端需要的格式
        voice_segments = [{
            'start_time': chunk['start_time'] / 1000.0,
            'end_time': chunk['end_time'] / 1000.0,
            'confidence': chunk['confidence'],
            'type': chunk['type']
        } for chunk in chunks_data]
        
        # 清理临时文件
        for chunk in chunks_data:
            try:
                os.unlink(chunk['file_path'])
            except:
                pass
        
        return jsonify({
            'success': True,
            'voice_segments': voice_segments,
            'audio_duration': max([chunk['end_time'] for chunk in chunks_data]) / 1000.0 if chunks_data else 0,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"VAD处理失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/asr', methods=['POST'])
def automatic_speech_recognition():
    """ASR自动语音识别接口"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': '没有音频文件'}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': '音频文件名为空'}), 400
        
        # 读取音频数据
        audio_data = audio_file.read()
        
        # 使用新的并发处理方法进行ASR
        result = voice_processor.process_audio_concurrent(audio_data)
        
        # 只返回ASR相关的结果
        if result['success']:
            return jsonify({
                'success': True,
                'result': {
                    'text': result['full_text'],
                    'confidence': result['overall_confidence'],
                    'segments': result['asr_results']
                },
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify(result), 500
        
    except Exception as e:
        logger.error(f"ASR处理失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/process', methods=['POST'])
def process_audio():
    """完整音频处理接口（VAD + ASR）"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': '没有音频文件'}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': '音频文件名为空'}), 400
        
        # 读取音频数据
        audio_data = audio_file.read()
        
        # 完整处理（VAD + ASR）
        result = voice_processor.process_audio_concurrent(audio_data)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"音频处理失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/models/status', methods=['GET'])
def models_status():
    """模型状态检查接口"""
    return jsonify({
        'vad': {
            'available': True,
            'model_name': 'pydub-vad',
            'method': 'silence_detection'
        },
        'asr': {
            'available': True,
            'model_name': 'SiliconFlow API',
            'api_endpoint': SILICONFLOW_API_URL,
            'model': DEFAULT_MODEL
        },
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': '音频文件过大'}), 413

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"内部服务器错误: {str(error)}")
    return jsonify({'error': '内部服务器错误'}), 500

if __name__ == '__main__':
    # 设置上传文件大小限制
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB
    
    # 创建必要的目录
    os.makedirs('./models', exist_ok=True)
    os.makedirs('./temp', exist_ok=True)
    
    logger.info("语音处理服务启动中...")
    logger.info(f"VAD方法: pydub VAD")
    logger.info(f"ASR方法: SiliconFlow API")
    logger.info(f"API端点: {SILICONFLOW_API_URL}")
    logger.info(f"模型: {DEFAULT_MODEL}")
    
    # 启动Flask应用
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
        threaded=True
    )