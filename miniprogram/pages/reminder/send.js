// 在pages/reminder/send.js中
Page({
    data: {
      contactId: '',
      receiverId: '',
      message: '',
      contactName: '',
      isLoading: true
    },
    
    // pages/reminder/send.js 中的 onLoad 函数
onLoad: function(options) {
    console.log('reminder/send页面加载，参数:', options);
    
    if (options.contactId && options.receiverId) {
      this.setData({
        contactId: options.contactId,
        receiverId: options.receiverId
      });
      
      // 添加详细日志
      console.log('准备获取联系人信息, ID:', options.contactId);
      
      const db = wx.cloud.database();
      db.collection('contacts').doc(options.contactId).get({
        success: res => {
          console.log('获取联系人成功:', res.data);
          this.setData({
            contactName: res.data.name,
            isLoading: false
          });
        },
        fail: err => {
          console.error('获取联系人失败:', err);
          // 显示错误信息而不是一直加载
          this.setData({
            contactError: true,
            errorMsg: '无法加载联系人信息',
            isLoading: false
          });
          
          wx.showToast({
            title: '获取联系人失败',
            icon: 'none'
          });
        }
      });
    } else {
      console.error('参数不完整:', options);
      this.setData({
        contactError: true,
        errorMsg: '参数不完整',
        isLoading: false
      });
    }
    // 添加这部分 - 请求订阅消息授权
  this.requestSubscription();
  },
    // 添加这个新函数
requestSubscription: function() {
    const templateId = '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE';
    
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        console.log('订阅消息授权结果:', res);
        if (res[templateId] === 'accept') {
          console.log('用户已授权接收订阅消息');
          this.setData({
            hasSubscribed: true
          });
        } else {
          console.log('用户拒绝订阅消息或授权已过期');
        }
      },
      fail: (err) => {
        console.error('请求订阅消息授权失败:', err);
      }
    });
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
    
    // pages/reminder/send.js 中的 sendReminder 函数
    sendReminder: function() {
    if (!this.data.message.trim()) {
      wx.showToast({
        title: '请输入通知内容',
        icon: 'none'
      });
      return;
    }
    
    // 再次检查所有必要参数
    if (!this.data.contactId || !this.data.receiverId || !this.data.contactName) {
      console.error('缺少必要参数:', {
        contactId: this.data.contactId,
        receiverId: this.data.receiverId,
        contactName: this.data.contactName
      });
      
      wx.showToast({
        title: '参数不完整，请重试',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '发送中...' });
    
    // 记录将要发送的数据
    console.log('准备发送通知:', {
      openid: this.data.receiverId,
      sender: this.data.contactName,
      content: this.data.message,
      templateId: '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE'
    });
    
    // 发送订阅消息通知
    wx.cloud.callFunction({
      name: 'sendNotification',
      data: {
        openid: this.data.receiverId,
        sender: this.data.contactName,
        content: this.data.message,
        templateId: '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE',
        triggerType: 'contact'
      }
    }).then(result => {
      wx.hideLoading();
      console.log('发送结果:', result);
      
      if (result.result && result.result.success) {
        wx.showToast({
          title: '通知已发送',
          icon: 'success'
        });
        this.setData({ message: '' });
      } else {
        const errorMsg = result.result && result.result.error ? result.result.error : '未知错误';
        wx.showModal({
          title: '发送失败',
          content: errorMsg,
          showCancel: false
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('发送通知失败:', err);
      
      wx.showModal({
        title: '发送失败',
        content: err.message || '网络错误',
        showCancel: false
      });
    });
  }
  });