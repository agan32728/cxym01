// miniprogram/pages/hairCircle/hairCircle.js
const db = wx.cloud.database();
let currentPage = 0 // 页码
let pageSize = 10 // 页面大小
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 展示用户发圈动态数据
    imgs:[],
    imgUrls:[],
    content:'',// 发布内容
    userId:'', // 用户id
    fileIds:[],// 文件路径
    detail:[], // 动态内容
    dataList: [], //放置返回数据的数组  
    loadMore: false, //"上拉加载"的变量，默认false，隐藏  
    loadAll: false //“没有数据”的变量，默认false，隐藏 
  },

  // 点击图片长按效果
  previewImage: function (e) {
    this.setData({
      imgs: e.target.dataset.srcs
    })
    wx.previewImage({
      current: e.target.dataset.current, // 当前显示图片的http链接   
      urls: this.data.imgs // 需要预览的图片http链接列表   
    })
  },

  // 查询数据库的动态文档
  selectUserDynamic: function(){
    var that = this; //这句不能少，在查询时
    wx.showLoading({
      title: '加载中...',
    });
    // 第一次加载数据
    if(currentPage == 1){
      this.setData({
        loadMore: true, // 把上啦加载的变量设为true显示
        loadAll: false // 把没有数据设置为false 隐藏
      })
    }
    // 实现云数据的请求
    db.collection('userDynamic').orderBy('saveTime', 'desc').skip(currentPage*pageSize).limit(pageSize).get({
      success(res) {
        if(res.data && res.data.length > 0){
          console.log('请求成功');
          console.log(this);
          currentPage ++;
          // 把新请求的数据添加到dataList里
          let list = that.data.detail.concat(res.data);
          that.setData({
            detail: list,// 获取数据数组
            loadMore: false // 把上拉变量设置为false显示
          });
          if(res.data.length < pageSize){
            // 页面数据长度小于页面大小了就证明加载完数据了
            that.setData({
              loadMore: false, // 隐藏加载中..
              loadAll: true // 所以的数据都加载完了
            });
          }
        }else {
          that.setData({
            loadAll: true, // 把没有数据加载设置为true显示
            loadMore: false // 把上拉加载变量设置为false 隐藏
          })
        }
        
        //将查询返回的结果赋值给本地变量,展示出动态的内容
         
        wx.hideLoading();
      },
      fail: err => {
        console.log('失败');
        that.setData({
          loadAll: false,
          loadMore: fals
        })
      }
    });
  },

  // 跳转到新界面，保留上一个界面
  gotoHairRing: function (event) {
    // 获取传来的对象 event.target.daataset
    wx.navigateTo({
      url: `hairRing/hairRing?userName=${event.detail.userInfo.nickName}&userHearImg=${event.detail.userInfo.avatarUrl}`,
    });
  },

  // 获取当前用户信息
  onGotUserInfo: function (event) {
    console.log(event)
    this.gotoHairRing(event);
  },

  //点击保存图片
  saveImages: function(e) {
    let that = this
    //若二维码未加载完毕，加个动画提高用户体验
    wx.showToast({
      icon: 'loading',
      title: '正在保存图片',
      duration: 1000
    })
    //将传来的动态图组装到数组中
    this.setData({
      imgUrls: e.target.dataset.imgs
    })
    //判断用户是否授权"保存到相册"
    wx.getSetting({
      success(res) {
        //没有权限，发起授权
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success() {//用户允许授权，保存图片到相册
              that.savePhoto();
            },
            fail() {//用户点击拒绝授权，跳转到设置页，引导用户授权
              wx.openSetting({
                success() {
                  wx.authorize({
                    scope: 'scope.writePhotosAlbum',
                    success() {
                      that.savePhoto();
                    }
                  })
                }
              })
            }
          })
        };
        //用户已授权，保存到相册
        that.savePhoto()
      }
    })
  },
  //下载图片地址并保存到相册，提示保存成功
  savePhoto: function() {
    var num = this.data.imgUrls.length;
    let that = this
    
    // 将图片地址数组循环遍历保存到本地相册
    for(var i = 0;i < num ; i++){
      wx.downloadFile({
        url: this.data.imgUrls[i],
        success: function (res) {
          console.log("下载图片",url,res)
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success(data) {
              wx.showToast({
                title: '保存成功',
                icon: "success",
                duration: 1000
              })
            }
          })
        },
        fail: function(err){
          console.log(err)
          console.log('下载失败')
        }
      })
    };
    // 提示用户保存成功
    wx.showToast({
      title: '保存成功',
    })
  },
 
  // 一键复制功能
  copyDetails: function (e) {

    var that = this;

    wx.setClipboardData({

      data: e.target.dataset.content,

      success: function (res) {

        wx.showModal({

          title: '提示',

          content: '复制成功',

          success: function (res) {

            if (res.confirm) {

              console.log('确定')

            } else if (res.cancel) {

              console.log('取消')

            }

          }

        })

      }

    });

  },

  // 分享函数 -- 用户点击分享可将小程序分享给微信好友。
  onShareAppMessage: function () {
    debugger
    return {
      title: 'CXP为美而来！创•乐享品质人生！',
      imageUrl: '../../images/chunxiyuemu.png',
      path: '/pages/hairCircle/hairCircle?id=' + wx.getStorageSync('userInfo').openid
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载获取用户id 
    wx.cloud.callFunction({
      name:'getUserDetail'
    }).then(res =>{
      console.log(res)
      this.setData({
        userId:res.result.openId
      })
    });

    this.selectUserDynamic();
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
    var that = this;
    currentPage = 0; // 页码
    pageSize = 10; // 页面大小
    that.setData({
      detail:[],
     
    })
    // 显示顶部刷新图标
    wx.showNavigationBarLoading();
    
    this.onLoad();
    console.log('下拉刷新啦')
        
        // 隐藏导航栏加载框
        wx.hideNavigationBarLoading();
        // 停止下拉动作
        wx.stopPullDownRefresh();
      
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log("上拉触底事件")
    let that = this
    if (!that.data.loadMore) {
      that.setData({
        loadMore: true, //加载中  
        loadAll: false //是否加载完所有数据
      });
      //加载更多，这里做下延时加载
      setTimeout(function () {
        that.selectUserDynamic()
      }, 2000)
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})