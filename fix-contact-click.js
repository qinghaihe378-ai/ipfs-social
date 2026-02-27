// 修复通讯录点击好友进入资料页的问题
// 修改 App.jsx 第1260-1280行

// 原代码：
// <div className="contact-item">
//   <div className="contact-avatar" onClick={...}>  // 点击头像进入资料
//   <div className="contact-info" onClick={...}>    // 点击信息进入聊天
// </div>

// 修改为（像微信一样）：
// <div className="contact-item" onClick={...}>     // 点击整个项进入资料页
//   <div className="contact-avatar">...</div>
//   <div className="contact-info">...</div>
// </div>
