// ==UserScript==
// @name         ddrk低端影视助手
// @namespace    king
// @version      0.4.1
// @description  1.自动播放下一集 2.收藏功能 3.历史观看记录 4.去广告
// @author       hero-king
// @match        https://ddrk.me/*
// @icon         https://ddrk.me/favicon-32x32.png
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_listValues
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @require      http://code.jquery.com/jquery-2.1.1.min.js
// ==/UserScript==

(async function () {
  "use strict";

  /** 广告隐藏class */
  const adClass = `<style>
    .cfa_popup {
      height: 0 !important;
    }
    #iaujwnefhw,#kasjbgih {
      height: 0 !important;
      overflow: hidden !important;
    }
  <style>`;
  $("head").append(adClass);
  /** 页面class */
  const mainCss = `<style>
    .ddrk-tools__modal {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      text-align: right;
    }
    .btn_col-default {
      position: absolute;
      top:0;
      font-size:22px;
      color: #2EBF8B;
      padding:6px;
      background-color: rgba(0,0,0,0.4);
      box-shadow: 0px 0px 5px rgba(0,0,0,0.4);
      line-height: 1.2;
      user-select:none;
    }
    .col_list {
      position: fixed;
      top: 35px;
      right: 0;
      width: 0;
      height: auto;
      min-height: 54px;
      box-sizing: border-box;
      background: #000;
      box-shadow: -1px 1px 5px rgba(0, 0, 0, 0.2);
      z-index: 999;
      transition: width .6s;
    }
    .col_list:hover {
      width: 300px;
    }
    .col_list:hover .col_list-ul{
      overflow: auto;
    }
    .col_list .col_list_arrow{
      position: absolute;
      left: -26px;
      top: 0;
      width: 26px;
      padding: 4px;
      background: #008080;
      color: #000;
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }
    .col_list > h6{
      color: #aaa;
      margin: 10px 0 5px 0;
      text-align: center;
      white-space: nowrap;
    }

    .col_list-ul::-webkit-scrollbar {
      width: 5px;
      height: 5px
    }

    .col_list-ul::-webkit-scrollbar-thumb {
      border-radius: 3px;
      -moz-border-radius: 3px;
      -webkit-border-radius: 3px;
      background-color: #999;
    }

    .col_list-ul::-webkit-scrollbar-track {
      background-color: transparent
    }

    .col_list-ul {
      width: 300px;
      height: 300px;
      padding: 5px 0;
      overflow: hidden;
      color: #20B2AA;
    }

    .col_list-ul .col_item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      margin: 5px 0;
      padding: 0 5px;
      line-height: 25px;
      border: 1px solid transparent;
      border-left: none;
      border-right: none;
    }
    .col_list-ul .col_item .his_time{
      font-size: 12px;
      color: #fff;
      margin-left: 20px;
      white-space: nowrap;
    }
    .col_list-ul .col_item .icon_del{
      border-radius: 100%;
      width: 16px;
      height: 16px;
      line-height: 1;
      display: none;
      text-align: center;
      color: #fff;
    }
    .col_list-ul .col_item:hover {
      box-shadow: 0 0 5px rgba(32,178,170,0.2);
      border-color: rgba(225,255,255,0.4);
    }
    .col_list-ul .col_item:hover .icon_del{
      display: inline-block;
    }
    #ddrk-tools_pipbtn{
      width: 0;
      height: 0;
      padding: 0;
      border: 0;
    }
    <style>`;
  $("head").append(mainCss);

  const Store = {
    setValue: function (key, value) {
      // 兼容移动端
      GM_setValue ? GM_setValue(key, value) : localStorage.setItem(key, value);
    },
    getValue: function (key) {
      return GM_getValue
        ? GM_getValue(key) || localStorage.getItem(key)
        : localStorage.getItem(key);
    },
    listValues: function () {
      return GM_listValues();
    },
  };

  const Common = {
    //参数time为休眠时间，单位为毫秒:
    sleep(time) {
      return new Promise((resolve) => {
        setTimeout(resolve, time);
      });
    },
    ready() {
      return new Promise((resolve) => {
        $(document).ready(function () {
          resolve();
        });
      });
    },
    getVue() {
      // 加载vuejs
      return new Promise((resolve) => {
        $.getScript("https://unpkg.com/vue@3.2.33/dist/vue.global.js", resolve);
      });
    },
  };

  /**
   * 获取历史记录localStorage
   */
  const LocalHistory = {
    async getLocalHistory() {
      const jsonText = Store.getValue("ddrk-history");
      let jsonList = [];
      if (jsonText) {
        jsonList = JSON.parse(jsonText);
      }

      const localData = this.getLocalStorageData();
      const his = this.formatLocalData(localData);
      const filterList = this.filterLocalData(his);
      let res = this.compareLocalData(jsonList, filterList);
      // console.log("history-----------------", his);
      for (const item of res) {
        if (!item.name) {
          const name = await this.getDramaName(item.url);
          item.name = name.indexOf("(") > -1 ? name.split("(")[0] : name;
        }
      }
      // 过滤name不存在的
      res = res.filter((item) => item.name);
      Store.setValue("ddrk-history", JSON.stringify(res));
      return res;
    },
    getLocalStorageData: function () {
      var len = localStorage.length; // 获取长度
      var arr = new Array(); // 定义数据集
      for (var i = 0; i < len; i++) {
        // 获取key 索引从0开始
        var getKey = localStorage.key(i);
        // 获取key对应的值
        var getVal = localStorage.getItem(getKey);
        // 放进数组
        arr[i] = {
          key: getKey,
          val: getVal,
        };
      }
      return arr;
    },
    // 去重
    filterLocalData(params) {
      const result = params.reduce((res, cur) => {
        const innerItem = res.find(
          (item) => item.enName === cur.enName && item.season === cur.season
        );
        if (innerItem) {
          if (+cur.ep > +innerItem.ep) {
            res.splice(
              res.findIndex(
                (item) =>
                  item.enName === cur.enName && item.season === cur.season
              ),
              1,
              cur
            );
          }
          return res;
        } else {
          return res.concat(cur);
        }
      }, []);
      return result;
    },
    // 格式化
    formatLocalData(local) {
      const history = local
        .filter((item) => item.key.indexOf("videojs-resume:") === 0)
        .map((item) => {
          const info = item.key.split("/");
          return {
            ...item,
            url: item.key.split(":")[1],
            enName: info[1],
            season: info.length > 3 && !isNaN(info[2]) ? info[2] : "",
            ep: info.at(-1).replace("?ep=", ""),
          };
        });
      return history;
    },
    // 对比
    compareLocalData(myList, ddrkList) {
      // 差集
      const minus = ddrkList.filter(
        (ddrkItem) =>
          !myList.some(
            (item) =>
              item.enName === ddrkItem.enName && item.season === ddrkItem.season
          )
      );
      // console.log("-----差集-----", minus);
      const resultList = myList.map((innerItem) => {
        const ddrkItem =
          ddrkList.find(
            (item) =>
              item.enName === innerItem.enName &&
              item.season === innerItem.season
          ) || {};
        return {
          ...innerItem,
          ...ddrkItem,
        };
      });
      return [...minus, ...resultList];
    },
    getDramaName(url) {
      return new Promise((resolve, reject) => {
        // $.get(`https://ddrk.me${url}`, function (result) {
        //   console.log(result);
        //   const name = $(result).find(".post-title").text();
        //   resolve(name);
        // }).error(function (XMLHttpRequest, textStatus, errorThrown) {
        //   console.log(XMLHttpRequest, textStatus, errorThrown);
        // });
        $.ajax({
          url: `https://ddrk.me${url}`,
          type: "get",
          success: function (result) {
            //成功后回调
            const name = $(result).find(".post-title").text();
            resolve(name);
          },
          error: function (e) {
            //失败后回调
            resolve("");
          },
        });
      });
    },
    handleColDel(index) {
      if (index !== -1) {
        colList.value.splice(index, 1);
        Store.setValue("ddrk-collection", JSON.stringify(colList.value));
      }
    },
  };

  // 监听 页面显示隐藏
  document.addEventListener("visibilitychange", async function () {
    // console.log("-----------", document.visibilityState);
    if (document.visibilityState == "hidden") {
      //切离该页面时执行
      // 标签隐藏时自动暂停播放（待开发）
    } else if (document.visibilityState == "visible") {
      //切换到该页面时执行
      // 刷新历史记录-因为需要和localStorage对比
      hisList.value = await LocalHistory.getLocalHistory();
    }
  });

  // 等待页面加载完成
  await Common.ready();
  await Common.getVue();

  // vue容器
  $("body").append($(`<div id="ddrk-tools" ></div>`));
  const { createApp, toRefs, ref, h } = Vue;

  const svg1 = {
    setup(props) {
      return () => [
        h(
          "svg",
          {
            class: "col_list_arrow",
            width: "32",
            height: "32",
            viewBox: "0 0 1024 1024",
          },
          [
            h("path", {
              fill: "#000",
              d: "M856.8 82.8H386.1c-40.4-43.2-135.5-67-188.9-67-94.9 0-175.8 70.5-188.9 164.4-5.6 16-8.3 31.3-8.3 46.7v603.7c0 98.7 80.3 179.2 179.2 179.2h695.7c82 0 148.8-66.7 148.8-148.8V249.8c0-92.2-74.8-167-166.9-167z m0 30.4c60 0 110.5 39.2 128.7 93.2H627.2l-183.5-93.2h413.1z m136.6 747.7c0 65.3-53.1 118.4-118.4 118.4H179.3c-82 0.1-148.9-66.7-148.9-148.8V226.8c0-12.3 2.3-24.7 7-38l0.8-3.2c10.5-79.4 78.7-139.5 159.1-139.5 56.2 0 142.9 26.7 170.1 61.2l4.6 5.8h2.6l242.3 120.3h374.9c0.6 5.3 1.6 10.6 1.6 16.1v611.4z m0 0",
            }),
            h("path", {
              fill: "#000",
              d: "M201.3 842.6h791v27.8h-791v-27.8z m-92.9 0h30.3v30.3h-30.3v-30.3z m258-260L346.1 693.8c-1.9 10.7 2.3 21.3 11 27.8 8.8 6.5 20.1 7.4 29.8 2.5l98.7-51.6 99.5 53.6c4.3 2.3 8.9 3.4 13.5 3.4 5.7 0 11.5-1.8 16.4-5.3 8.8-6.3 13.3-16.8 11.6-27.6L608.1 586.8l81.8-78c7.8-7.5 10.7-18.6 7.5-29-3.3-10.4-12-17.8-22.7-19.5L564.5 444l-49-101.9c-4.7-9.8-14.4-15.9-25.2-16.1-9.7-0.5-20.7 5.8-25.6 15.5L415.1 441.1l-112 15.1c-10.7 1.5-19.6 8.8-23.1 19.1s-0.8 21.4 6.9 29.1l79.5 78.2z m52.8-111.3c9.2-1.2 17.2-6.9 21.5-15.3l49.2-97.2 47.2 98.3c4.1 8.4 12 14.3 21.2 15.7L666.1 489.6l-78.8 75.2c-6.7 6.4-9.9 15.7-8.4 25l18.5 108.3-97.3-52.3c-4.2-2.3-8.8-3.4-13.4-3.4-4.4 0-8.9 1-13 3.1l-97 49.7 19.6-107.3c1.7-9.2-1.3-18.6-7.9-25.1l-77.3-77 108.1-14.5z m0 0",
            }),
          ]
        ),
      ];
    },
  };
  const svg2 = {
    setup(props) {
      return () => [
        h(
          "svg",
          {
            class: "col_list_arrow",
            width: "32",
            height: "32",
            viewBox: "0 0 1024 1024",
          },
          [
            h("path", {
              fill: "#000",
              d: "M204.8 552.96h204.8a20.48 20.48 0 0 1 0 40.96H204.8a20.48 20.48 0 0 1 0-40.96z",
            }),
            h("path", {
              fill: "#000",
              d: "M143.36 921.6a40.96 40.96 0 0 1-40.96-40.96V143.36a40.96 40.96 0 0 1 40.96-40.96h614.4a40.96 40.96 0 0 1 40.96 40.96v327.68h40.96V143.36a81.92 81.92 0 0 0-81.92-81.92H143.36a81.92 81.92 0 0 0-81.92 81.92v737.28a81.92 81.92 0 0 0 81.92 81.92h327.68v-40.96z",
            }),
            h("path", {
              fill: "#000",
              d: "M737.28 512a225.28 225.28 0 1 0 225.28 225.28 225.28 225.28 0 0 0-225.28-225.28z m0 409.6a184.32 184.32 0 1 1 184.32-184.32 184.32 184.32 0 0 1-184.32 184.32z",
            }),
            h("path", {
              fill: "#000",
              d: "M771.2768 660.6848Q634.88 584.0896 634.88 737.28t136.6016 76.5952q136.192-76.5952-0.2048-153.1904z m-13.5168 122.88Q675.84 829.44 675.84 737.28t81.92-46.08q81.92 46.08 0 92.16zM225.28 307.2h-20.48a20.48 20.48 0 0 0 0 40.96h20.48zM696.32 307.2H266.24v40.96h430.08a20.48 20.48 0 0 0 0-40.96z",
            }),
          ]
        ),
      ];
    },
  };

  // 外壳组件
  const MainBody = {
    props: {
      title: {
        type: String,
        required: true,
      },
      style: {
        type: Object,
        required: true,
      },
      list: {
        type: Array,
        required: true,
        default: () => [],
      },
    },
    setup(props, { slots }) {
      const { title, style, list } = toRefs(props);
      return () =>
        h("div", { class: "col_list", style: style?.value }, [
          h("h6", title.value),
          title.value === "收藏夹" ? h(svg1) : h(svg2),
          h(
            "ul",
            {
              class: "col_list-ul",
            },
            list.value.map((item, index) => {
              if (title.value === "收藏夹") {
                return h(ColItem, {
                  item,
                  index,
                  key: item.href,
                });
              } else {
                return h(HistoryItem, {
                  item,
                  index,
                  key: item.url + item.val,
                });
              }
            })
          ),
        ]);
    },
  };
  // 收藏item组件
  const ColItem = {
    props: {
      item: {
        type: Object,
        required: true,
      },
      index: {
        type: Number,
        required: true,
      },
    },
    setup(props, { slots }) {
      const { item, index } = props;
      return () =>
        h(
          "li",
          {
            class: "col_item",
            onClick: () => {
              window.location.href = item.href;
            },
          },
          [
            h("span", `${index + 1}. ${item.name}`),
            h(
              "span",
              {
                class: "icon_del",
                onClick: (event) => {
                  event.stopPropagation();
                  LocalHistory.handleColDel(index);
                },
              },
              "x"
            ),
          ]
        );
    },
  };
  // 历史item组件
  const HistoryItem = {
    props: {
      item: {
        type: Object,
        required: true,
      },
      index: {
        type: Number,
        required: true,
      },
    },
    setup(props, { slots }) {
      const { item, index } = props;
      const season = item.season ? `S${item.season}` : "";
      const ep = item.ep ? `E${item.ep}` : "";
      const hour =
        parseInt(item.val / 3600) > 0 ? parseInt(item.val / 3600) : 0;
      const min =
        parseInt((item.val - hour * 3600) / 60) > 0
          ? parseInt((item.val - hour * 3600) / 60)
          : 0;
      const sec = parseInt(item.val - hour * 3600 - min * 60);
      const timeStr = `${hour > 9 ? hour : "0" + hour}:${min > 9 ? min : "0" + min
        }:${sec > 9 ? sec : "0" + sec}`;
      return () =>
        h(
          "li",
          {
            class: "col_item",
            onClick: () => {
              window.location.href = item.url;
            },
          },
          [
            h("span", `${index + 1}. ${item.name} ${season}${ep}`),
            h(
              "span",
              {
                class: "his_time",
              },
              timeStr
            ),
          ]
        );
    },
  };

  let colList = ref(JSON.parse(Store.getValue("ddrk-collection") || "[]"));
  let hisList = ref(await LocalHistory.getLocalHistory());
  // 根组件
  const App = {
    render() {
      return h("div", { class: "container" }, [
        h(MainBody, {
          title: "收藏夹",
          style: { top: "35px", "z-index": 100 },
          list: colList.value,
        }),
        h(MainBody, {
          title: "历史记录",
          style: { top: "85px", "z-index": 99 },
          list: hisList.value,
        }),
      ]);
    },
  };
  const app = createApp(App);
  app.mount("#ddrk-tools");

  /**
   * 蒙层及收藏
   */
  const Collection = {
    init() {
      const modal = $("<div  class='ddrk-tools__modal'></div>");
      const colButton = $(
        '<span class="btn_col-default btn_col-remove">★</span>'
      );
      $(".post-box").each(function () {
        const tempBtn = colButton.clone(true);
        if (!colList.value.find((item) => item.href === $(this).data("href"))) {
          tempBtn.addClass("btn_col-add");
          tempBtn.removeClass("btn_col-remove");
          tempBtn.text("☆");
        }
        modal.html(tempBtn);
        $(this).append(modal.clone(true));
      });
      this.bindEvent();
    },
    bindEvent() {
      const self = this;
      // 点击打开新页签--后续添加到设置
      $(".post-box").on("click", ".ddrk-tools__modal", function (e) {
        window.open($(this).parent().data("href"));
        e.stopPropagation();
      });
      $(".post-box").on("click", ".btn_col-default", function (e) {
        e.stopPropagation();
      });
      $(".post-box").on("click", ".btn_col-add", function (e) {
        const href = $(this).parent().parent().data("href");
        const name = $(this).parent().parent().find(".post-box-title a").text();
        if (!colList.value.find((item) => item.href === href)) {
          colList.value.push({
            name: name.indexOf("(") > -1 ? name.split("(")[0] : name,
            href,
          });
          Store.setValue("ddrk-collection", JSON.stringify(colList.value));
        }
        self.reloadCollectHtml(1, $(this));
      });
      $(".post-box").on("click", ".btn_col-remove", function (e) {
        const href = $(this).parent().parent().data("href");
        const index = colList.value.findIndex((item) => item.href === href);
        if (index !== -1) {
          colList.value.splice(index, 1);
          Store.setValue("ddrk-collection", JSON.stringify(colList.value));
        }
        self.reloadCollectHtml(0, $(this));
      });
    },
    reloadCollectHtml(tag, tempBtn) {
      if (tempBtn) {
        if (tag === 0) {
          tempBtn.addClass("btn_col-add");
          tempBtn.removeClass("btn_col-remove");
          tempBtn.text("☆");
        } else {
          tempBtn.addClass("btn_col-remove");
          tempBtn.removeClass("btn_col-add");
          tempBtn.text("★");
        }
      } else {
        $(".post-box").each(function () {
          const tempBtn = $(this).find(".btn_col-default");
          if (
            !colList.value.find((item) => item.href === $(this).data("href"))
          ) {
            tempBtn.addClass("btn_col-add");
            tempBtn.removeClass("btn_col-remove");
            tempBtn.text("☆");
          } else {
            tempBtn.addClass("btn_col-remove");
            tempBtn.removeClass("btn_col-add");
            tempBtn.text("★");
          }
        });
      }
    },
  };
  Collection.init();

  /**
   * 自动跳转并播放下一集
   */
  const autoPlayNext = {
    player: null,
    playerModel: {},
    nextType: "hand", // 手动 | 自动
    init() {
      this.initPlayer();
      this.bindEvent();
      // Videojs requestPictureInPicture()在滚动到顶部和底部时仅工作一次
      // 解决方案：通过添加按钮模拟点击解决
      $("body").append(
        $(`<button id="ddrk-tools_pipbtn" title="切换画中画"></button>`)
      );
    },
    initPlayer() {
      this.player = unsafeWindow.videojs.getAllPlayers()[0];
      console.time("视频源数据加载完成");
      // 监听
      this.player?.one("canplaythrough", async (e) => {
        console.timeEnd("视频源数据加载完成");
        await Common.sleep(200);
        this.nextType === "auto" && this.restoreVideoModel();
      });
      this.player?.on("ended", async () => {
        // console.log("--------------ended-------------");
        this.getCurrentVideoModel(); // 在下一集之前获取当前video状态
        if (this.playerModel.isInPictureInPicture) {
          //在画中画模式z则退出
          // document.exitPictureInPicture();
          $("#ddrk-tools_pipbtn")[0].click();
        }
        this.handleToNext();
        this.nextType = "auto";
        await Common.sleep(200);
        this.initPlayer();
        this.handleToPlay();
      });
    },
    bindEvent() {
      // 主动点击下一集
      $(unsafeWindow.document).on(
        "click",
        ".wp-playlist-tracks .wp-playlist-item, icon-angle-right",
        async (e) => {
          await Common.sleep(200);
          this.initPlayer();
          this.nextType = "hand";
        }
      );
      // 切换画中画
      $("body").on("click", "#ddrk-tools_pipbtn", function (e) {
        if (!document.pictureInPictureElement) {
          $("#vjsp_html5_api")[0].requestPictureInPicture();
        } else {
          document.exitPictureInPicture();
        }
      });
    },
    getCurrentVideoModel() {
      // 保存当前video模式
      this.playerModel = {
        isFullscreen: this.player.isFullscreen_, // 全屏
        isInPictureInPicture: !!document.pictureInPictureElement, // 画中画
        isFullWindow: !!$(".vjs-theater-mode-control-close").length, // 网页全屏:打开时会包含vjs-theater-mode-control-close
      };
    },
    handleToNext() {
      (this.player.controlBar.childNameIndex_.nextButton || {}).handleClick(); // 下一集按钮
    },
    handleToPlay() {
      if (this.player.resumeModal?.opened_) {
        // 已打开恢复弹框则选择 是
        this.player.resumeModal.childNameIndex_.modalButtons.childNameIndex_.resumeButton.el_.click();
      } else {
        this.player.bigPlayButton?.el_.click(); //播放按钮
        localStorage.setItem(
          window.location.href.replace("https://ddrk.me", "videojs-resume:"),
          0
        );
      }
    },
    async restoreVideoModel() {
      // 恢复上次video模式
      if (this.playerModel.isFullscreen) {
        // (
        //   this.player.controlBar.childNameIndex_.fullscreenToggle || {}
        // ).handleClick();
        this.player.controlBar.childNameIndex_.fullscreenToggle.el_.click();
      } else if (this.playerModel.isInPictureInPicture) {
        // await Common.sleep(2000);
        // (
        //   this.player.controlBar.childNameIndex_.pictureInPictureToggle || {}
        // ).handleClick();
        // this.player.controlBar.childNameIndex_.pictureInPictureToggle.el_.click();
        // $("#vjsp_html5_api")[0].requestPictureInPicture();
        $("#ddrk-tools_pipbtn")[0].click();
      } else if (this.playerModel.isFullWindow) {
        (
          this.player.controlBar.childNameIndex_.theaterModeToggle || {}
        ).handleClick();
        // this.player.controlBar.childNameIndex_.theaterModeToggle.el_.click();
      }
    },
  };
  autoPlayNext.init();

  // /**
  //  * 播放页上次观看记录提示
  //  */
  // const watchRecord = {
  //   init() {
  //     // 有播放器则继续
  //     if (unsafeWindow.videojs.getAllPlayers()[0]) {
  //       this.bindEvent();
  //     }
  //   },
  //   bindEvent() {
  //     $(window).bind("beforeunload", function () {
  //       // debugger;
  //       // return "dfdfdsfsfs提示：未保存的内容将会丢失。"; //好像这个提示并没什么用
  //     });
  //   },
  // };
  // watchRecord.init();

  // 设置 1、自动播放开关，点击打开新页签开关
})();
