const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
  async updateFeedback({ feedbackId, lastReplyDate, status }) {
    try {
      const res = await db.collection('opendb-feedback')
        .doc(feedbackId)
        .update({
          reply_count: dbCmd.inc(1),
          last_reply_date: lastReplyDate,
          status: status
        });
      return { success: true, data: res };
    } catch (err) {
      console.error('Error in updateFeedback:', err);
      return { success: false, error: err.message };
    }
  }
};