// 在pages/reminder/send.js中
Page({
    data: {
      contactId: '',
      receiverId: '',
      message: '',
      contactName: '',
      isLoading: true
    },
    
    onLoad: function(options) {
      if (options.contactId && options.receiverId) {
        this.setData({
          contactId: options.contactId,
          receiverId: options.receiverId
        });
        this.fetchContactDetails(options.contactId);
      } else {
        wx.showToast({
          title: '参数错误',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    },
    
    fetchContactDetails: function(contactId) {
      const db = wx.cloud.database();
      db.collection('contacts').doc(contactId).get().then(res => {
        this.setData({
          contactName: res.data.name,
          isLoading: false
        });
      }).catch(err => {
        wx.showToast({
          title: '获取联系人信息失败',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      });
    },
    
    onMessageInput: function(e) {
      this.setData({
        message: e.detail.value
      });
    },
    
    sendReminder: function() {
      if (!this.data.message.trim()) {
        wx.showToast({
          title: '请输入通知内容',
          icon: 'none'
        });
        return;
      }
      
      wx.showLoading({ title: '发送中...' });
      
      // 先保存通知到数据库
      const db = wx.cloud.database();
      db.collection('notifications').add({
        data: {
          sender: this.data.contactName,
          content: this.data.message,
          receiverId: this.data.receiverId,
          createdAt: db.serverDate(),
          isRead: false
        }
      }).then(res => {
        // 发送订阅消息通知
        wx.cloud.callFunction({
          name: 'sendNotification',
          data: {
            openid: this.data.receiverId,
            sender: this.data.contactName,
            content: this.data.message,
            notificationId: res._id,
            templateId: 'YOUR_TEMPLATE_ID' // 替换为您的模板ID
          }
        }).then(result => {
          wx.hideLoading();
          if (result.result && result.result.success) {
            wx.showToast({
              title: '通知已发送',
              icon: 'success'
            });
            this.setData({ message: '' });
          } else {
            wx.showToast({
              title: '发送失败: ' + (result.result.error || '未知错误'),
              icon: 'none'
            });
          }
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({
            title: '发送通知失败',
            icon: 'none'
          });
        });
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '保存通知失败',
          icon: 'none'
        });
      });
    }
  });