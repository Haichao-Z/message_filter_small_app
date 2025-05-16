const app = getApp();
const db = wx.cloud.database();
const notificationsCollection = db.collection('notifications');

Page({
  data: {
    notifications: [],
    isLoading: true
  },
  
  onLoad: function() {
    this.fetchNotificationHistory();
  },
  
  onShow: function() {
    this.fetchNotificationHistory();
  },
  
  // 获取通知历史
  fetchNotificationHistory: function() {
    const that = this;
    that.setData({ isLoading: true });
    
    notificationsCollection.where({
      _openid: app.globalData.openid || ''
    })
    .orderBy('createdAt', 'desc')
    .get()
    .then(res => {
      // 格式化时间
      const notifications = res.data.map(notification => {
        return {
          ...notification,
          formattedTime: this.formatTime(notification.createdAt)
        };
      });
      
      that.setData({
        notifications: notifications,
        isLoading: false
      });
    }).catch(err => {
      console.error('获取通知历史失败：', err);
      that.setData({ isLoading: false });
      wx.showToast({
        title: '获取通知历史失败',
        icon: 'none'
      });
    });
  },
  
  // 格式化时间
  formatTime: function(dateObj) {
    if (!dateObj) return '';
    
    const date = new Date(dateObj);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },
  
  // 清空历史记录
  clearHistory: function() {
    const that = this;
    
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有通知历史记录吗？',
      success(res) {
        if (res.confirm) {
          // 创建云函数清空历史记录
          wx.cloud.callFunction({
            name: 'clearNotificationHistory',
            data: {}
          }).then(() => {
            that.setData({ notifications: [] });
            wx.showToast({
              title: '清空成功',
              icon: 'success'
            });
          }).catch(err => {
            console.error('清空历史记录失败：', err);
            wx.showToast({
              title: '清空失败',
              icon: 'none'
            });
          });
        }
      }
    });
  }
});