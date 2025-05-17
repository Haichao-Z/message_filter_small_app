// 获取应用实例
const app = getApp();
const db = wx.cloud.database();
const contactsCollection = db.collection('contacts');

Page({
  data: {
    contacts: [],
    isLoading: true,
    isDev: true,  // 设置为true时会显示测试按钮，发布前改为false

    shareQrCode: '',
    showShareModal: false,  // 初始值应该是false
    currentShareContactId: ''
  },
  
  onLoad: function() {
    // 页面加载时获取联系人列表
    this.fetchContacts();
  },
  
  onShow: function() {
    // 页面显示时刷新联系人列表
    this.fetchContacts();
  },
  
  // 获取联系人列表
  fetchContacts: function() {
    const that = this;
    that.setData({ isLoading: true });
    
    const db = wx.cloud.database();
    const contactsCollection = db.collection('contacts');
    
    // 打印当前用户openid
    console.log('当前用户openid:', app.globalData.openid);
    
    contactsCollection.get({
      success: function(res) {
        console.log('获取联系人成功:', res);
        
        // 确认每个联系人对象的结构
        res.data.forEach(contact => {
          console.log('联系人:', contact.name, 'ID:', contact._id, '重要状态:', contact.isImportant);
        });
        
        that.setData({
          contacts: res.data,
          isLoading: false
        });
      },
      fail: function(err) {
        console.error('获取联系人失败:', err);
        that.setData({ isLoading: false });
        wx.showToast({
          title: '获取联系人失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 切换联系人重要状态
  toggleImportant: function(e) {
    // 获取开关的当前状态和联系人ID
    const newStatus = e.detail.value;
    const id = e.currentTarget.dataset.id;
    
    console.log('toggleImportant被调用');
    console.log('联系人ID:', id);
    console.log('新状态:', newStatus);
    
    // 安全检查 - ID是否存在
    if (!id) {
      console.error('错误：联系人ID为空');
      wx.showToast({
        title: '操作失败：联系人ID无效',
        icon: 'none'
      });
      return;
    }
    
    // 查找联系人
    const contact = this.data.contacts.find(c => c._id === id);
    console.log('找到的联系人:', contact);
    
    if (!contact) {
      console.error('错误：找不到联系人');
      wx.showToast({
        title: '操作失败：找不到联系人',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '更新中...',
    });
    
    // 更新数据库
    contactsCollection.doc(id).update({
      data: {
        isImportant: newStatus
      }
    }).then(res => {
      console.log('数据库更新成功:', res);
      wx.hideLoading();
      
      // 更新本地数据
      const updatedContacts = this.data.contacts.map(c => {
        if (c._id === id) {
          return {...c, isImportant: newStatus};
        }
        return c;
      });
      
      this.setData({ contacts: updatedContacts });
      
      wx.showToast({
        title: newStatus ? '已设为重要联系人' : '已取消重要联系人',
        icon: 'success'
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('更新联系人状态失败：', err);
      
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },
  
  // 导航到添加联系人页面
  navigateToAdd: function() {
    wx.navigateTo({
      url: '/pages/contact/add'
    });
  },
  
  // 导航到编辑联系人页面
  navigateToEdit: function(e) {
    const id = e.currentTarget.dataset.id;
    console.log('导航到编辑页面，联系人ID:', id);
    wx.navigateTo({
      url: `/pages/contact/edit?id=${id}`
    });
  },
  
  // 删除联系人
  deleteContact: function(e) {
    const id = e.currentTarget.dataset.id;
    const that = this;
    
    // 打印ID以便调试
    console.log('尝试删除联系人ID:', id);
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此联系人吗？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
          });
          
          contactsCollection.doc(id).remove()
            .then(() => {
              wx.hideLoading();
              console.log('删除成功, ID:', id);
              
              // 更新本地数据
              const updatedContacts = that.data.contacts.filter(c => c._id !== id);
              that.setData({ contacts: updatedContacts });
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            })
            .catch(err => {
              wx.hideLoading();
              console.error('删除联系人失败：', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  // 测试通知（仅开发环境使用）
  testNotification: function() {
    const contact = this.data.contacts.find(c => c.isImportant);
    
    if (!contact) {
      wx.showToast({
        title: '请先添加重要联系人',
        icon: 'none'
      });
      return;
    }
    
    // 先保存通知到数据库
    wx.cloud.callFunction({
      name: 'saveNotification',
      data: {
        sender: contact.name,
        content: '这是一条测试通知，来自重要联系人。'
      }
    }).then(saveRes => {
      if (saveRes.result && saveRes.result.success) {
        // 然后发送订阅通知
        wx.cloud.callFunction({
          name: 'sendNotification',
          data: {
            openid: app.globalData.openid,
            sender: contact.name,
            content: '这是一条测试通知，来自重要联系人。',
            notificationId: saveRes.result.notificationId,
            templateId: '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE' // 使用您的模板ID
          }
        }).then(sendRes => {
          wx.showToast({
            title: '测试通知已发送',
            icon: 'success'
          });
        }).catch(err => {
          console.error('发送测试通知失败：', err);
          wx.showToast({
            title: '发送测试通知失败',
            icon: 'none'
          });
        });
      }
    }).catch(err => {
      console.error('保存测试通知失败：', err);
      wx.showToast({
        title: '测试通知失败',
        icon: 'none'
      });
    });
  },

  // 测试login功能
  testLogin: function() {
    wx.showLoading({
      title: '测试login...',
    });
    
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        wx.hideLoading();
        console.log('login测试成功:', res);
        
        wx.showModal({
          title: 'Login成功',
          content: `获取到openid: ${res.result.openid || '无'}`,
          showCancel: false
        });
        
        // 更新全局openid
        getApp().globalData.openid = res.result.openid;
      },
      fail: err => {
        wx.hideLoading();
        console.error('login测试失败:', err);
        
        wx.showModal({
          title: 'Login失败',
          content: JSON.stringify(err),
          showCancel: false
        });
      }
    });
  },

  // 分享联系人
  shareWithContact: function(e) {
    const contactId = e.currentTarget.dataset.id;
    
    console.log('开始生成分享码，联系人ID:', contactId);
    console.log('当前用户openid:', app.globalData.openid);
    
    this.setData({
      currentShareContactId: contactId
    });
    
    // 简化处理 - 直接显示分享模态框
    this.setData({
      showShareModal: true
    });
    
    wx.showLoading({ title: '生成分享码...' });
    
    // 添加详细日志
    console.log('准备调用云函数', {
      name: 'quickstartFunctions',
      data: {
        type: 'getMiniProgramCode',
        path: `pages/reminder/send?contactId=${contactId}&receiverId=${app.globalData.openid}`
      }
    });
    
    // 调用云函数生成小程序码
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: {
        type: 'getMiniProgramCode',
        path: `pages/reminder/send?contactId=${contactId}&receiverId=${app.globalData.openid}`
      }
    }).then(res => {
      wx.hideLoading();
      console.log('云函数调用成功，返回结果:', res);
      
      if (res.result) {
        this.setData({
          shareQrCode: res.result
        });
      } else {
        console.error('返回结果不含fileID:', res);
        wx.showToast({
          title: '生成二维码失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('调用云函数失败:', err);
      wx.showToast({
        title: '生成分享码失败',
        icon: 'none'
      });
    });
  },
  
  // 关闭分享模态框
  closeShareModal: function() {
    this.setData({
      showShareModal: false  // 修正：应该设为false
    });
  },
  
  // 添加转发功能
  onShareAppMessage: function(res) {
    if (this.data.currentShareContactId) {
      return {
        title: '点击发送重要通知',
        path: `/pages/reminder/send?contactId=${this.data.currentShareContactId}&receiverId=${app.globalData.openid}`,
        imageUrl: '../../images/icons/avatar.png' // 使用现有图片
      }
    }
    return {
      title: '重要联系人通知筛选器',
      path: '/pages/index/index'
    }
  },

  // 处理图片加载错误
  handleImageError: function(e) {
    console.error('图片加载失败:', e);
    wx.showToast({
      title: '二维码加载失败',
      icon: 'none'
    });
  },
  
  // 检查订阅状态
  checkSubscription: function() {
    // 检查是否已获得订阅授权
    wx.getSetting({
      withSubscriptions: true,
      success: (res) => {
        const templateId = '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE';
        
        // 如果没有授权，显示订阅引导
        if (!res.subscriptionsSetting || !res.subscriptionsSetting[templateId] || res.subscriptionsSetting[templateId] !== 'accept') {
          this.setData({
            showSubscribeTip: true
          });
        }
      }
    });
  },
  
  // 请求订阅消息
  requestSubscription: function() {
    const templateId = '95gSh9BVBrjej4zHZSCvDGCC0b7-7oVUK9-p3a11azE';
    
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        if (res[templateId] === 'accept') {
          wx.showToast({
            title: '订阅成功，现在您可以接收通知',
            icon: 'none',
            duration: 2000
          });
        }
        this.setData({
          showSubscribeTip: false
        });
      }
    });
  }
});