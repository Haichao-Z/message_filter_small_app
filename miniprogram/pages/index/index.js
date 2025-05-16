// 获取应用实例
const app = getApp();
const db = wx.cloud.database();
const contactsCollection = db.collection('contacts');

Page({
  data: {
    contacts: [],
    isLoading: true,
    isDev: true  // 设置为true时会显示测试按钮，发布前改为false
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
    const newStatus = e.detail.value;  // 这是开关的新状态
    const id = e.currentTarget.dataset.id;
    
    console.log('toggleImportant被调用');
    console.log('联系人ID:', id);
    console.log('新状态:', newStatus);
    console.log('当前联系人列表:', this.data.contacts);
    
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
    
    // 获取数据库引用
    const db = wx.cloud.database();
    const contactsCollection = db.collection('contacts');
    
    console.log('准备更新数据库，ID:', id, '新状态:', newStatus);
    
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
      console.error('详细错误信息:', err);
      
      wx.showToast({
        title: '操作失败，请查看控制台错误',
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
  // 导航到编辑联系人页面
    navigateToEdit: function(e) {
        const id = e.currentTarget.dataset.id;
        console.log('导航到编辑页面，联系人ID:', id);
        wx.navigateTo({
        url: `/pages/contact/edit?id=${id}`
        });
    },
  
  // 删除联系人
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
            templateId: 'YOUR_TEMPLATE_ID' // 替换为您的模板ID
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
  }
});