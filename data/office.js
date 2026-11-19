// 办公室教程资料。截图已裁切，路径相对于首页 index.html。
window.OFFICE = {
  networks: [
    { label: "员工 Wi‑Fi", name: "For YonyouSG Staff", passwordHelp: "请向 HR 或办公室 IT 获取员工网络密码。" },
    { label: "访客 Wi‑Fi", name: "For YonyouSG Guest", passwordHelp: "请向办公室前台或行政索取访客网络密码。" }
  ],
  appImage: "assets/tutorial/app.webp",
  attendance: [
    {
      title: "登录友空间私有版",
      text: "打开友空间私有版。可选择手机号登录，输入手机号，获取并输入验证码。"
    },
    {
      title: "切换到新加坡公司",
      text: "点页面顶部的企业名称，选择 Yonyou(Singapore) Pte Ltd。",
      image: "assets/tutorial/youzone-company.webp",
      alt: "友空间顶部企业名称和公司列表中的 Yonyou(Singapore) Pte Ltd"
    },
    {
      title: "打开底部「工作台」",
      text: "在底部导航点「工作台」，进入应用入口。",
      image: "assets/tutorial/youzone-workbench.webp",
      alt: "友空间底部导航，中间为工作台"
    },
    {
      title: "点「一键签到」",
      text: "在工作台点「一键签到」，打开签到页。",
      image: "assets/tutorial/youzone-attendance.webp",
      alt: "友空间工作台右侧圈出的「一键签到」入口"
    },
    {
      title: "确认蓝色内勤状态",
      text: "在办公室先连员工 Wi-Fi，确认签到页显示蓝色「内勤打卡」状态，再按页面提示完成打卡。",
      image: "assets/tutorial/youzone-blue.webp",
      alt: "友空间签到页中蓝色的内勤打卡按钮"
    }
  ],
  leave: [
    "先通知部门经理和 HR。HR 联系方式以你的入职通知为准。",
    "在友空间「工作台」打开「请假」，选择请假类型并提交。",
    "如果界面或选项有问题，请联系 HR 核对。补卡可到签到页底部的「统计」查看异常记录，次数和时限以 HR 确认的现行规则为准。"
  ],
  printers: [
    {
      area: "销售市场部",
      name: "OKI MC363 PCL6",
      ip: "10.170.110.18",
      location: "10 楼办公室内，销售市场部办公区"
    },
    {
      area: "顾问实施部",
      name: "OKI MC363 PCL6 (copy1)",
      ip: "10.170.110.200",
      location: "10 楼办公室内，顾问实施部办公区"
    }
  ],
  printerSteps: [
    {
      title: "添加打印机或扫描仪",
      text: "从 Windows 开始菜单搜索并打开「添加打印机或扫描仪」（Add a printer or scanner），开始搜索设备。",
      image: "assets/tutorial/printer-add.webp",
      alt: "Windows 搜索结果中圈出的 Add a printer or scanner 设置"
    },
    {
      title: "选择「所需的打印机未列出」",
      text: "等搜索结束，选择「我需要的打印机不在列表中」（The printer that I want isn't listed）。",
      image: "assets/tutorial/printer-missing.webp",
      alt: "Windows 打印机和扫描仪设置及手动添加入口"
    },
    {
      title: "使用 TCP/IP 地址或主机名添加",
      text: "在向导中选「使用 TCP/IP 地址或主机名添加打印机」（Add a printer using a TCP/IP address or hostname），点击「下一步」（Next）。",
      image: "assets/tutorial/printer-tcp.webp",
      alt: "Windows 添加打印机向导中选中的 TCP/IP 地址或主机名选项"
    },
    {
      title: "输入对应地址",
      text: "将上方所选办公区的 IP 地址填入「主机名或 IP 地址」栏，再点「下一步」，按向导完成安装。"
    },
    {
      title: "打印测试页",
      text: "安装完成后点「打印测试页」（Print a test page），到所选办公区的设备确认是否出纸。"
    }
  ]
};

