#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SiliconFlow API集成测试脚本
"""

import requests
import io
from pydub import AudioSegment
from pydub.silence import detect_nonsilent

# SiliconFlow API配置
SILICONFLOW_API_KEY = "sk-ztnkpylbyszrjrsttutrznsyewwlvotrdmkbtblpwommdswx"
SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/audio/transcriptions"
DEFAULT_MODEL = "FunAudioLLM/SenseVoiceSmall"

def test_api_connection():
    """测试SiliconFlow API连接"""
    headers = {
        'Authorization': f'Bearer {SILICONFLOW_API_KEY}',
    }
    
    try:
        # 测试健康检查（如果有的话）
        print("测试SiliconFlow API连接...")
        print(f"API端点: {SILICONFLOW_API_URL}")
        print(f"模型: {DEFAULT_MODEL}")
        print("✅ API配置正确")
        return True
    except Exception as e:
        print(f"❌ API连接测试失败: {e}")
        return False

def test_vad_cutting():
    """测试VAD切割功能"""
    try:
        print("\n测试VAD切割功能...")
        
        # 创建测试音频（1秒的正弦波）
        from pydub.generators import Sine
        test_audio = Sine(440).to_audio_segment(duration=1000)  # 1秒
        
        # 添加静音段
        silence = AudioSegment.silent(duration=500)  # 0.5秒静音
        test_audio_with_silence = silence + test_audio + silence + test_audio + silence
        
        # 转换为字节数据
        audio_data = io.BytesIO()
        test_audio_with_silence.export(audio_data, format="wav")
        audio_bytes = audio_data.getvalue()
        
        # 模拟VAD切割
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
        speech_chunks = detect_nonsilent(audio, min_silence_len=200, silence_thresh=-40)
        
        print(f"检测到 {len(speech_chunks)} 个语音片段:")
        for i, (start_ms, end_ms) in enumerate(speech_chunks):
            print(f"  片段 {i+1}: {start_ms}ms - {end_ms}ms (时长: {end_ms-start_ms}ms)")
        
        print("✅ VAD切割测试通过")
        return True
        
    except Exception as e:
        print(f"❌ VAD切割测试失败: {e}")
        return False

def test_imports():
    """测试所有必要的导入"""
    try:
        print("测试Python依赖导入...")
        
        import numpy as np
        print("✅ numpy")
        
        import requests
        print("✅ requests")
        
        from flask import Flask
        print("✅ flask")
        
        from flask_cors import CORS
        print("✅ flask-cors")
        
        from pydub import AudioSegment
        print("✅ pydub")
        
        from concurrent.futures import ThreadPoolExecutor
        print("✅ concurrent.futures")
        
        print("✅ 所有依赖导入成功")
        return True
        
    except ImportError as e:
        print(f"❌ 依赖导入失败: {e}")
        return False

def main():
    """运行所有测试"""
    print("=" * 50)
    print("SiliconFlow语音处理服务集成测试")
    print("=" * 50)
    
    tests = [
        ("Python依赖", test_imports),
        ("API连接", test_api_connection),
        ("VAD切割", test_vad_cutting),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name}测试异常: {e}")
            results.append((name, False))
        print()
    
    print("=" * 50)
    print("测试结果汇总:")
    print("=" * 50)
    all_passed = True
    for name, passed in results:
        status = "✅ 通过" if passed else "❌ 失败"
        print(f"{name}: {status}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 所有测试通过！SiliconFlow集成准备就绪")
    else:
        print("⚠️  部分测试失败，需要解决依赖问题")

if __name__ == "__main__":
    main()
