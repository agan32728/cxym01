// miniprogram/pages/hairCircle/hairRing/hairRing.js
const db = wx.cloud.database(); // 初始化数据库
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userId: '',
    imgs: [],
    content: '',// 发布内容
    fileIds: [],
    userInfo:{},
    userName:'',
    userHearImg:'',
    saveTime:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      userName:options.userName,
      userHearImg:options.userHearImg
    })
    console.log(this.data.userName,this.data.userHearImg);
    wx.cloud.callFunction({
      name:'getUserDetail'
  }).then(res => {
    this.setData({
      userId: res.result.openId
    })
  })
  },

  // 提交发圈内容(文字内容+图片)
  //1 先将图片上传到云存储 2将要上传的数据插入到数据库中去
  submit: function () {

    wx.showLoading({
      title: '发圈中...',
    });
    // 上传图片到云存储
    let promiseArr = [];
    for (let i = 0; i < this.data.imgs.length; i++) {
      promiseArr.push(new Promise((reslove, reject) => {
        let item = this.data.imgs[i]; //获取图片
        let suffix = /\.\w+$/.exec(item)[0];  // 正则表达式，返回文件扩展名
        wx.cloud.uploadFile({
          cloudPath: new Date().getTime() + suffix, // 上传到云端的路径名
          filePath: item, // 文件路径
          success: res => {
            // get resource ID 成功返回fileID发圈
            console.log(res.fileID);
            this.setData({
              fileIds: this.data.fileIds.concat(res.fileID),
            });
            reslove();
          },
          fail: err => {
            // handle error
          }
        })
      }))
    }
    Promise.all(promiseArr).then(res => {
      
      // 插入数据
      db.collection('userDynamic').add({
        data: {
          // 插入的内容评分和id
          content: this.data.content,
          userId: this.data.userId,
          fileIds: this.data.fileIds,
          userName: this.data.userName,
          userHearImg: this.data.userHearImg,
          saveTime: new Date().getTime()
        }
      }).then(res => {
        // 存储成功提示
        wx.hideLoading();
        wx.showToast({
          title: '发圈成功',
        });
        wx.navigateBack({
          url: '../hairCircle'
        })
        // wx.switchTab({
          
        // })
      
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '发圈失败',
        });
        wx.switchTab({
          url: '../hairCircle'
        })
      })
    });

  },

  // 发圈函数 -- 提交图片
  chooseImg() {
    let that = this;
    let len = this.data.imgs;
    if (len >= 9) {
      this.setData({
        lenMore: 1
      })
      return;
    }
    // 上传图片
    wx.chooseImage({
      success: (res) => {
        let tempFilePaths = res.tempFilePaths;
        console.log(tempFilePaths)
        let imgs = that.data.imgs;
        for (let i = 0; i < tempFilePaths.length; i++) {
          if (imgs.length < 9) {
            imgs.push(tempFilePaths[i])
          } else {
            that.setData({
              imgs
            })
            wx.showModal({
              title: '提示',
              content: '最多只能有九张图片'
            })
            return;
          }
        }
        that.setData({
          imgs
        })
      }
    })
  },
  previewImg(e) {
    let index = e.currentTarget.dataset.index;
    let imgs = this.data.imgs;
    wx.previewImage({
      current: imgs[index],
      urls: imgs,
    })
  },
  deleteImg(e) {
    let _index = e.currentTarget.dataset.index;
    let imgs = this.data.imgs;
    imgs.splice(_index, 1);
    this.setData({
      imgs
    })
  },

  // 获取发布文字内容
  onContentChange: function (event) {
    // 评价内容改变进行重新赋值
    this.setData({
      content: event.detail
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})