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
  
  try {
    // 查询当前用户的所有通知记录
    const notifications = await db.collection('notifications')
      .where({
        _openid: openid
      })
      .get();
    
    // 批量删除记录
    const deletePromises = notifications.data.map(notification => {
      return db.collection('notifications').doc(notification._id).remove();
    });
    
    await Promise.all(deletePromises);
    
    return {
      success: true,
      deleted: notifications.data.length
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error
    };
  }
};