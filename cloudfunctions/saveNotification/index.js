// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const { sender, content } = event;
  
  if (!sender || !content) {
    return {
      success: false,
      error: '缺少必要参数'
    };
  }
  
  try {
    // 保存通知记录
    const result = await db.collection('notifications').add({
      data: {
        _openid: openid,
        sender,
        content,
        isRead: false,
        createdAt: db.serverDate()
      }
    });
    
    return {
      success: true,
      notificationId: result._id
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error
    };
  }
};