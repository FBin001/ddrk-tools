// ==UserScript==
// @name         ddrk低端影视助手
// @namespace    king
// @version      1.2.0
// @description  1.自动播放下一集 2.收藏功能 3.历史观看记录 4.去广告 5.播放记录 6.小窗口播放
// @author       hero-king
// @match        https://ddrk.me/*
// @icon         https://ddrk.me/favicon-32x32.png
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_listValues
// @grant        GM_setValue
// @grant        GM_getValue
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      https://cdn.staticfile.org/vue/3.2.33/vue.global.min.js
// @require      https://cdn.staticfile.org/popper.js/2.11.5/umd/popper.min.js
// ==/UserScript==

(async function () {
  "use strict";
  // @require      https://unpkg.com/@popperjs/core@2
  // @require      https://unpkg.com/popper.js
  // @require      https://unpkg.com/eruda@2.3.3/eruda.js
  // eruda.init();

  const STORE_COLLECTION_KEY = "ddrk-tools-collection";
  const STORE_HITORY_KEY = "ddrk-tools-history";
  const STORE_RESUME_KEY = "ddrk-tools-resume";
  const STORE_SETTINGS_KEY = "ddrk-tools-settings";
  const STORE_RECORD_KEY = "ddrk-tools-play-record";

  const TIME_END = 215999; //单位：秒(s)，59:59:59

  const WD = window.unsafeWindow || document.defaultView || window;
  WD.Vue = Vue
  WD.Popper = Popper

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
      right: -32px;
      width: 32px;
      padding: 6px;
      background-color: rgba(0,0,0,0.6);
      box-shadow: 4px 0px 8px rgba(0,0,0,0.4);
      line-height: 1;
      user-select:none;
    }
    .btn_col-playpage {
      position: fixed;
      left: 20px;
      bottom: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 42px;
      height: 42px;
      z-index: 9999;
      border-radius: 5%;
      background: rgba(0,0,0,0.5);
      cursor: pointer;
    }
    .col_list {
      position: fixed;
      top: 35px;
      right: 0;
      width: 0;
      height: auto;
      min-height: 54px;
      box-sizing: border-box;
      background: #2c2c2c;
      box-shadow: -20px 10px 60px rgba(0, 0, 0, 0.6);
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
      margin: 5px 0;
      padding: 0 5px;
      line-height: 25px;
      border: 1px solid transparent;
      border-left: none;
      border-right: none;
    }
    .col_list-ul .col_item a {
      color: #20B2AA;
    }
    .col_list-ul .col_item .col_item-left{
      vertical-align: middle;
    }
    .col_list-ul .col_item .col_item-left svg{
      vertical-align: text-top;
    }
    .col_list-ul .col_item .col_item-left .col_item-tags{
      display: inline-block;
      min-width: 23px;
      text-align: right;
      padding-right: 4px;
      box-sizing: content-box;
    }
    .col_list-ul .col_item .col_item-right{
      display: flex;
      align-items: center;
    }
    .col_list-ul .col_item .his_time{
      font-size: 12px;
      color: #fff;
      margin-left: 5px;
      white-space: nowrap;
      line-height: 1;
    }
    .col_list-ul .col_item .his_time_end{
      color: #20B2AA;
    }
    .col_list-ul .col_item .icon_del{
      display: none;
      cursor: pointer;
    }
    .col_list-ul .col_item .icon_top{
      display: none;
      cursor: pointer;
    }
    .col_list-ul .col_item:hover {
      // box-shadow: 0 0 5px rgba(32,178,170,0.2);
      // border-color: rgba(225,255,255,0.4);
      background: #333;
    }
    .col_list-ul .col_item:hover .icon_del{
      display: inline-block;
    }
    .col_list-ul .col_item:hover .icon_top{
      display: inline-block;
    }
    .col_list-ul .col_item:hover .icon_top_tag{
      display: none;
    }
    .col_list-ul .col_item:hover .col_item-index{
      display: none;
    }
    /** 小窗播放 css */
    .ddrk-tools__video-window-small{
      position: fixed !important;
      right: 5px;
      bottom: 10px;
      width: 30vw !important;
      height: 16.875vw !important;
      padding: 0 !important;
      z-index: 9;
    }
    .ddrk-tools__video-placeholder{
      background: #000;
    }

    /** popper css */
    #msg-box{
      background-color: #fff;
      color: #606266;
      padding: 12px;
      border-radius: 4px;
      font-size: 14px;
      box-shadow: 0px 0px 20px rgba(0, 0, 0, .35);
    }
    // #msg-box .msg-box_btns{
    //   text-align: right;
    // }
    // #msg-box .msg-box_btns button{
    //   padding: 5px 12px;
    //   border-radius: 4px;
    //   color: #409eff;
    //   background: #ecf5ff;
    //   outline: none;
    //   border: none;
    //   cursor: pointer;
    // }

    #msg-box[data-popper-placement^='top'] > #msg-arrow {
      bottom: -4px;
    }

    #msg-box[data-popper-placement^='bottom'] > #msg-arrow {
      top: -4px;
    }

    #msg-box[data-popper-placement^='left'] > #msg-arrow {
      right: -4px;
    }

    #msg-box[data-popper-placement^='right'] > #msg-arrow {
      left: -4px;
    }

    #msg-arrow,
    #msg-arrow::before {
      position: absolute;
      width: 8px;
      height: 8px;
      background: inherit;
    }

    #msg-arrow {
      visibility: hidden;
    }

    #msg-arrow::before {
      visibility: visible;
      content: '';
      transform: rotate(45deg);
    }
    <style>`;
  $("head").append(mainCss);

  /** pretty-checkbox css */
  $("head").append(
    `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pretty-checkbox/3.0.3/pretty-checkbox.min.css" integrity="sha512-kz4Ae66pquz4nVE5ytJyKfPDkQyHSggaDtT1v8oLfOd8bB+ZgZXNLaxex99MNu4fdCsWmi58mhLtfGk5RgfcOw==" crossorigin="anonymous" referrerpolicy="no-referrer" />`
  );

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
    isMobile() {
      return /Mobi|Android|iPhone/i.test(navigator.userAgent);
    }
  };

  const Store = {
    setValue: function (key, value) {
      // 兼容移动端
      window.GM_setValue
        ? GM_setValue(key, value)
        : localStorage.setItem(key, value);
    },
    getValue: function (key) {
      return window.GM_getValue
        ? GM_getValue(key) || localStorage.getItem(key)
        : localStorage.getItem(key);
    },
    listValues: function () {
      return GM_listValues();
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
      // console.log(localData);
      const newhis = localData.filter(
        (item) => item.key.indexOf("videojs-resume:") === 0
      );
      const oldhis = JSON.parse(Store.getValue(STORE_RESUME_KEY) || "[]");
      // 差集
      const minus = newhis.filter(
        (newItem) =>
          !oldhis.some(
            (oldItem) =>
              oldItem.key === newItem.key && oldItem.val === newItem.val
          )
      );
      // console.log("minus", minus);
      const minushis = this.formatLocalData(minus);
      const filterList = this.filterLocalData(minushis);
      // console.log("filterListMinus", filterList);
      let res = this.compareLocalData(jsonList, filterList);
      for (const item of res) {
        /** category为修复字段，后续删除判断条件 */
        if ((!item.name || !item.category) && (item.errorTimes || 0) < 50) {
          const { name = "", category } = await this.getDramaName(item.url);
          item.name = name.indexOf("(") > -1 ? name.split("(")[0] : name;
          item.category = category;
          if (!name) {
            // 记录该记录请求失败次数
            item.errorTimes = item.errorTimes ? item.errorTimes++ : 1;
          }
        }
      }
      // 过滤name不存在的
      res = res.filter((item) => item.name);
      Store.setValue("ddrk-history", JSON.stringify(res));
      Store.setValue(STORE_HITORY_KEY, JSON.stringify(res));
      Store.setValue(STORE_RESUME_KEY, JSON.stringify(newhis));
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
    // 格式化
    formatLocalData(local) {
      const history = local.map((item) => {
        const info = item.key.split("/");
        return {
          ...item,
          url: item.key.split(":")[1],
          enName: info[1],
          season: info.length > 3 && !isNaN(info[2]) ? info[2] : "",
          ep: info.at(-1).replace("?ep=", ""),
          t: Date.now(),
        };
      });
      return history;
    },
    // 去重 并取最大ep
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
    // 对比
    compareLocalData(myList, updateList) {
      const unTopIndex = myList.findIndex((ele) => !ele.isTop);
      // 差集（优先）
      const difference = [];
      updateList.forEach((updateItem) => {
        const index = myList.findIndex(
          (item) =>
            item.enName === updateItem.enName &&
            item.season === updateItem.season
        );
        if (index !== -1) {
          const tempItem = {
            ...myList[index],
            ...updateItem,
          };
          myList.splice(index, 1); // 删除
          myList.splice(unTopIndex, 0, tempItem); // 新增
        } else {
          difference.push(updateItem);
        }
      });
      // 插入差集
      myList.splice(unTopIndex, 0, difference);
      return [].concat.apply([], myList);
    },
    getDramaName(url) {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: `https://ddrk.me${url}`,
          type: "get",
          success: function (result) {
            //成功后回调
            const $result = $(result);
            const name = $result.find(".post-title").text();
            const types = [];
            $result
              .find(".meta_categories .cat-links a")
              .text(function (index, oldcontent) {
                types.push(oldcontent);
              });
            resolve({ name, category: types.join(",") });
          },
          error: function (e) {
            //失败后回调
            resolve({});
          },
        });
      });
    },
  };

  /** 设置 */
  const Settings = {
    defaultData: [
      { id: 1, name: "自动播放下一集", val: true },
      { id: 2, name: "点击海报打开新标签", val: true },
      { id: 3, name: "播放时提示上次观看位置", val: true },
      { id: 4, name: "开启小窗口播放(脱离可视区域时)", val: true },
    ],
    getData() {
      const localDataStr = Store.getValue(STORE_SETTINGS_KEY);
      if (localDataStr) {
        const localData = JSON.parse(localDataStr);
        return this.defaultData.map((item) => {
          const { val = true } =
            localData.find((ele) => ele.id === item.id) || {};
          return {
            ...item,
            val,
          };
        });
      }
      return this.defaultData;
    },
    getValueById(id) {
      return (
        settingsList.value.find((item) => item.id === id) || { val: true }
      ).val;
    },
  };

  // 等待页面加载完成
  await Common.ready();

  // vue容器
  $("body").append($(`<div id="ddrk-tools" ></div>`));
  const { createApp, toRefs, ref, h, defineComponent, watch } = Vue;

  const IconCollection = defineComponent({
    template: `<svg class="col_list_arrow" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M856.8 82.8H386.1c-40.4-43.2-135.5-67-188.9-67-94.9 0-175.8 70.5-188.9 164.4-5.6 16-8.3 31.3-8.3 46.7v603.7c0 98.7 80.3 179.2 179.2 179.2h695.7c82 0 148.8-66.7 148.8-148.8V249.8c0-92.2-74.8-167-166.9-167z m0 30.4c60 0 110.5 39.2 128.7 93.2H627.2l-183.5-93.2h413.1z m136.6 747.7c0 65.3-53.1 118.4-118.4 118.4H179.3c-82 0.1-148.9-66.7-148.9-148.8V226.8c0-12.3 2.3-24.7 7-38l0.8-3.2c10.5-79.4 78.7-139.5 159.1-139.5 56.2 0 142.9 26.7 170.1 61.2l4.6 5.8h2.6l242.3 120.3h374.9c0.6 5.3 1.6 10.6 1.6 16.1v611.4z m0 0" fill="#000000" p-id="2983"></path><path d="M201.3 842.6h791v27.8h-791v-27.8z m-92.9 0h30.3v30.3h-30.3v-30.3z m258-260L346.1 693.8c-1.9 10.7 2.3 21.3 11 27.8 8.8 6.5 20.1 7.4 29.8 2.5l98.7-51.6 99.5 53.6c4.3 2.3 8.9 3.4 13.5 3.4 5.7 0 11.5-1.8 16.4-5.3 8.8-6.3 13.3-16.8 11.6-27.6L608.1 586.8l81.8-78c7.8-7.5 10.7-18.6 7.5-29-3.3-10.4-12-17.8-22.7-19.5L564.5 444l-49-101.9c-4.7-9.8-14.4-15.9-25.2-16.1-9.7-0.5-20.7 5.8-25.6 15.5L415.1 441.1l-112 15.1c-10.7 1.5-19.6 8.8-23.1 19.1s-0.8 21.4 6.9 29.1l79.5 78.2z m52.8-111.3c9.2-1.2 17.2-6.9 21.5-15.3l49.2-97.2 47.2 98.3c4.1 8.4 12 14.3 21.2 15.7L666.1 489.6l-78.8 75.2c-6.7 6.4-9.9 15.7-8.4 25l18.5 108.3-97.3-52.3c-4.2-2.3-8.8-3.4-13.4-3.4-4.4 0-8.9 1-13 3.1l-97 49.7 19.6-107.3c1.7-9.2-1.3-18.6-7.9-25.1l-77.3-77 108.1-14.5z m0 0" fill="#000000" p-id="2984"></path></svg>`,
  });
  const IconHistory = defineComponent({
    template: `<svg class="col_list_arrow" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M204.8 552.96h204.8a20.48 20.48 0 0 1 0 40.96H204.8a20.48 20.48 0 0 1 0-40.96z" p-id="4654" fill="#000000"></path><path d="M143.36 921.6a40.96 40.96 0 0 1-40.96-40.96V143.36a40.96 40.96 0 0 1 40.96-40.96h614.4a40.96 40.96 0 0 1 40.96 40.96v327.68h40.96V143.36a81.92 81.92 0 0 0-81.92-81.92H143.36a81.92 81.92 0 0 0-81.92 81.92v737.28a81.92 81.92 0 0 0 81.92 81.92h327.68v-40.96z" p-id="4655" fill="#000000"></path><path d="M737.28 512a225.28 225.28 0 1 0 225.28 225.28 225.28 225.28 0 0 0-225.28-225.28z m0 409.6a184.32 184.32 0 1 1 184.32-184.32 184.32 184.32 0 0 1-184.32 184.32z" p-id="4656" fill="#000000"></path><path d="M771.2768 660.6848Q634.88 584.0896 634.88 737.28t136.6016 76.5952q136.192-76.5952-0.2048-153.1904z m-13.5168 122.88Q675.84 829.44 675.84 737.28t81.92-46.08q81.92 46.08 0 92.16zM225.28 307.2h-20.48a20.48 20.48 0 0 0 0 40.96h20.48zM696.32 307.2H266.24v40.96h430.08a20.48 20.48 0 0 0 0-40.96z" p-id="4657" fill="#000000"></path></svg>`,
  });
  const IconSettings = defineComponent({
    template: `<svg class="col_list_arrow" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M746.666667 469.333333H277.333333C159.509333 469.333333 64 373.824 64 256S159.509333 42.666667 277.333333 42.666667h469.333334c117.802667 0 213.333333 95.509333 213.333333 213.333333s-95.530667 213.333333-213.333333 213.333333z m0-384H277.333333a170.666667 170.666667 0 0 0 0 341.333334h469.333334a170.666667 170.666667 0 0 0 0-341.333334zM277.333333 384a128 128 0 1 1 0-256 128 128 0 0 1 0 256z m0-213.333333a85.333333 85.333333 0 1 0 0 170.666666 85.333333 85.333333 0 0 0 0-170.666666z m0 384h469.333334c117.802667 0 213.333333 95.530667 213.333333 213.333333s-95.530667 213.333333-213.333333 213.333333H277.333333C159.509333 981.333333 64 885.802667 64 768s95.509333-213.333333 213.333333-213.333333z m0 384h469.333334a170.666667 170.666667 0 0 0 0-341.333334H277.333333a170.666667 170.666667 0 0 0 0 341.333334z m469.333334-298.666667a128 128 0 0 1 0 256 128 128 0 0 1 0-256z m0 213.333333a85.333333 85.333333 0 1 0 0-170.666666 85.333333 85.333333 0 0 0 0 170.666666z" fill="#2c2c2c" p-id="12986"></path></svg>`,
  });
  const IconDelete = defineComponent({
    template: `<svg class="icon_del" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><title>删除</title><path d="M202.666667 256h-42.666667a32 32 0 0 1 0-64h704a32 32 0 0 1 0 64H266.666667v565.333333a53.333333 53.333333 0 0 0 53.333333 53.333334h384a53.333333 53.333333 0 0 0 53.333333-53.333334V352a32 32 0 0 1 64 0v469.333333c0 64.8-52.533333 117.333333-117.333333 117.333334H320c-64.8 0-117.333333-52.533333-117.333333-117.333334V256z m224-106.666667a32 32 0 0 1 0-64h170.666666a32 32 0 0 1 0 64H426.666667z m-32 288a32 32 0 0 1 64 0v256a32 32 0 0 1-64 0V437.333333z m170.666666 0a32 32 0 0 1 64 0v256a32 32 0 0 1-64 0V437.333333z" p-id="2817" fill="#ffffff"></path></svg>`,
  });
  const IconTop = defineComponent({
    template: `<svg class="icon_top" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><title>置顶</title><path d="M555.818667 940.629333c-6.229333 56.746667-85.418667 51.669333-88.533334 0V324.693333l-272.64 263.210667c-42.752 36.778667-93.610667-22.058667-61.824-60.757333 120.704-117.034667 337.322667-326.485333 342.4-331.349334 19.968-21.674667 51.413333-22.784 72.661334 0 39.808 38.442667 334.890667 322.986667 343.808 333.226667 29.952 37.205333-18.432 92.245333-59.733334 61.226667-10.666667-9.002667-276.053333-265.514667-276.053333-265.514667l-0.085333 615.893333zM168.448 42.666667h687.104c14.336 0 21.504 8.704 21.504 26.069333 0 17.408-7.168 26.069333-21.504 26.069333H168.448c-14.336 0-21.504-8.661333-21.504-26.026666 0-17.408 7.168-26.112 21.504-26.112z" p-id="891" fill="#ffffff"></path></svg>`,
  });
  const IconTopCancel = defineComponent({
    template: `<svg class="icon_top" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><title>取消置顶</title><path d="M189.3 115h653.4c12.1 0 22-9.9 22-22v-6c0-12.1-9.9-22-22-22H189.3c-12.1 0-22 9.9-22 22v6c0 12.1 9.9 22 22 22zM152.2 524.5c-16.1 15.5-16.5 41.4-1 57.5s41.4 16.5 57.5 1l150.5-145-57.4-57.6-149.6 144.1zM474.5 918.4c0 22.4 18.3 40.6 40.6 40.6 22.4 0 40.6-18.3 40.6-40.6V635.3l-81.3-81.6v364.7zM872.3 524.5L547.1 211.3c-7.5-9.5-19-15.6-32-15.6h-0.5c-0.8 0-1.6 0-2.4 0.1-10.9-0.6-22 3.2-30.4 11.3l-98.4 94.7 57.4 57.6 33.6-32.3v66l81.3 81.6V332.5l260.1 250.4c16.1 15.5 41.9 15.1 57.5-1 15.6-16 15.1-41.9-1-57.4zM257.1 207c-6.6-6.7-15.4-10-24.1-10-8.7 0-17.4 3.3-24 9.9-13.3 13.3-13.3 34.8-0.1 48.1l538 540c6.6 6.7 15.4 10 24.1 10 8.7 0 17.4-3.3 24-9.9 13.3-13.3 13.3-34.8 0.1-48.1l-538-540z" p-id="18070" fill="#ffffff"></path></svg>`,
  });
  const IconTopTag = defineComponent({
    template: `<svg class="icon_top_tag" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M320.32 704.18c14.058 14.06 14.058 36.854 0 50.913L125.864 949.547c-14.06 14.059-36.853 14.059-50.912 0-14.059-14.059-14.059-36.853 0-50.912l194.454-194.454c14.06-14.059 36.853-14.059 50.912 0z m629.906-396.904c14.818 14.818 13.897 39.112-2 52.766L717.082 558.556l0.667 2.734c27.425 114.91-4.257 237.542-87.885 325.02l-2.745 2.84-2.725 2.759c-14.036 14.195-36.941 14.26-51.057 0.144L126.447 445.162c-14.06-14.059-14.06-36.853 0-50.912 90.247-90.248 220.23-123.274 340.164-91.125l2.991 0.82 195.22-227.306c13.517-15.74 37.463-16.8 52.322-2.445z m-78.374 23.45L694.138 153.011 508.752 368.87a36 36 0 0 1-38.937 10.616l-3.106-1.086c-88.26-30.386-185.781-14.902-260.063 41.255l-2.2 1.682 392.717 392.718 0.874-1.132c54.977-71.991 71.575-166.167 44.804-252.737l-1.07-3.393a36 36 0 0 1 10.96-37.877l219.12-188.19z" p-id="15602" fill="#FA8D14"></path></svg>`,
  });

  // 收藏组件
  const ComponentCollection = {
    setup(props, { slots }) {
      return () =>
        h(
          "ul",
          {
            class: "col_list-ul",
          },
          colList.value.map((item, index) => {
            return h(
              "li",
              {
                class: "col_item",
                onClick: () => {
                  // window.location.href = item.href;
                },
              },
              [
                h("span", [
                  `${index + 1}. `,
                  h("a", { href: item.href }, `${item.name}`),
                ]),
                h(IconDelete, {
                  class: "icon_del",
                  onClick: (event) => {
                    event.stopPropagation();
                    LocalCollection.handleColDel(index);
                    LocalCollection.reloadCollectButton();
                  },
                }),
              ]
            );
          })
        );
    },
  };
  // 历史组件
  const ComponentHistory = {
    setup(props, { slots }) {
      watch(
        hisList,
        (newVal, oldVal) => {
          Store.setValue("ddrk-history", JSON.stringify(newVal));
          Store.setValue(STORE_HITORY_KEY, JSON.stringify(newVal));
        },
        { deep: true }
      );
      const cancelTop = (item) => {
        if (!item.isTop) return;
        item.isTop = false;
        const newItem = hisList.value.splice(
          hisList.value.findIndex((ele) => ele.key === item.key),
          1
        )[0];
        const unTopIndex = hisList.value.findIndex((ele) => !ele.isTop);
        hisList.value.splice(unTopIndex, 0, newItem);
      };
      const handleTop = (item) => {
        item.isTop = true;
        hisList.value.unshift(
          hisList.value.splice(
            hisList.value.findIndex((ele) => ele.key === item.key),
            1
          )[0]
        );
      };
      const formatTime = (time) => {
        const hour = parseInt(time / 3600) > 0 ? parseInt(time / 3600) : 0;
        const min =
          parseInt((time - hour * 3600) / 60) > 0
            ? parseInt((time - hour * 3600) / 60)
            : 0;
        const sec = parseInt(time - hour * 3600 - min * 60);
        const resultStr = `${hour > 9 ? hour : "0" + hour}:${
          min > 9 ? min : "0" + min
        }:${sec > 9 ? sec : "0" + sec}`;
        return resultStr;
      };
      return () =>
        h(
          "ul",
          {
            class: "col_list-ul",
          },
          hisList.value
            .filter((item) => {
              // 对比集数有没有变化
              // 没有变化就对比观看时间有没有变化
              return item.deleteInfo
                ? item.ep !== item.deleteInfo.ep
                  ? true
                  : item.ep === item.deleteInfo.ep &&
                  item.val !== item.deleteInfo.val
                : true;
            })
            .map((item, index) => {
              const season = item.season ? `S${item.season}` : "";
              const ep = item.category?.includes("电影")
                ? ""
                : item.ep
                  ? `E${item.ep}`
                  : "";
              const timeStr =
                +item.val === TIME_END
                  ? "已看完"
                  : +item.val === 0
                    ? "未观看"
                    : formatTime(item.val);
              return h(
                "li",
                {
                  class: "col_item",
                  onClick: () => {
                    // window.location.href = item.url;
                  },
                },
                [
                  h("span", { class: "col_item-left" }, [
                    h("span", { class: "col_item-tags" }, [
                      item.isTop
                        ? h(IconTopCancel, {
                          onClick: () => cancelTop(item),
                        })
                        : h(IconTop, {
                          onClick: () => handleTop(item),
                        }),
                      item.isTop
                        ? h(IconTopTag)
                        : h(
                          "span",
                          { class: "col_item-index" },
                          `${
                            index +
                            1 -
                            hisList.value.filter((ele) => ele.isTop).length
                          }.`
                        ),
                    ]),
                    h("a", { href: item.url }, `${item.name} ${season}${ep}`),
                  ]),
                  h(
                    "div",
                    {
                      class: "col_item-right",
                    },
                    [
                      h(IconDelete, {
                        onClick: () => {
                          // 删除时记录下当前值，后续进行对比
                          item.deleteInfo = {
                            ep: item.ep,
                            val: item.val,
                            t: Date.now(),
                          };
                          cancelTop(item);
                        },
                      }),
                      h(
                        "span",
                        {
                          class: {
                            his_time: true,
                            his_time_end: +item.val === TIME_END,
                          },
                        },
                        timeStr
                      ),
                    ]
                  ),
                ]
              );
            })
        );
    },
  };
  // 设置组件
  const ComponentSettings = {
    setup(props, { slots }) {
      return () =>
        h(
          "ul",
          {
            class: "col_list-ul",
          },
          settingsList.value.map((item, index) => {
            return h(
              "li",
              {
                class: "col_item",
              },
              [
                h("span", item.name),
                h(
                  "div",
                  {
                    class: "pretty p-switch p-fill",
                  },
                  [
                    h("input", {
                      type: "checkbox",
                      checked: !!item.val,
                      onChange: (e) => {
                        item.val = e.target.checked;
                        Store.setValue(
                          STORE_SETTINGS_KEY,
                          JSON.stringify(settingsList.value)
                        );
                      },
                    }),
                    h("div", { class: "state p-primary" }, h("label")),
                  ]
                ),
              ]
            );
          })
        );
    },
  };
  // 外壳组件
  const ListBody = {
    props: {
      title: {
        type: String,
        required: true,
      },
      style: {
        type: Object,
        required: true,
      },
    },
    setup(props, { slots }) {
      const { title, style } = toRefs(props);
      const iconArr = {
        收藏夹: [IconCollection, ComponentCollection],
        观看记录: [IconHistory, ComponentHistory],
        设置: [IconSettings, ComponentSettings],
      };
      return () =>
        h("div", { class: "col_list", style: style?.value }, [
          h("h6", title.value),
          h(iconArr[title.value][0]),
          h(iconArr[title.value][1]),
        ]);
    },
  };
  let colList = ref(JSON.parse(Store.getValue("ddrk-collection") || "[]"));
  let hisList = ref(await LocalHistory.getLocalHistory());
  let settingsList = ref(Settings.getData());
  // 根组件
  const ComponentApp = {
    render() {
      return h("div", { class: "ddrk-tools-container" }, [
        h(ListBody, {
          title: "收藏夹",
          style: { top: "35px", "z-index": 100 },
        }),
        h(ListBody, {
          title: "观看记录",
          style: { top: "85px", "z-index": 99 },
        }),
        h(ListBody, {
          title: "设置",
          style: { top: "135px", "z-index": 98 },
        }),
      ]);
    },
  };
  const app = createApp(ComponentApp);
  app.mount("#ddrk-tools");

  // 监听 页面显示隐藏
  document.addEventListener("visibilitychange", async function () {
    // console.log("-----------", document.visibilityState);
    if (document.visibilityState == "hidden") {
      //切离该页面时执行
      // 标签隐藏时自动暂停播放（后续开发）
    } else if (document.visibilityState == "visible") {
      //切换到该页面时执行
      // 刷新历史记录-因为需要和localStorage对比
      settingsList.value = Settings.getData();
      colList.value = JSON.parse(Store.getValue("ddrk-collection") || "[]");
      LocalCollection.reloadCollectButton();
      hisList.value = await LocalHistory.getLocalHistory();
    }
  });
  /**
   * 蒙层及收藏
   */
  const IconStarSlim =
    '<svg viewBox="0 0 1026 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><title>收藏</title><path d="M1019.109859 384c-11.286261-32.01113-39.713391-55.05113-74.195478-60.126609L701.69212 288.233739l-105.627826-216.019478c-15.270957-31.276522-48.261565-51.489391-84.057043-51.489391-35.706435 0-68.652522 20.21287-83.968 51.489391l-105.672348 216.041739L79.166902 323.940174c-34.504348 4.964174-62.953739 27.981913-74.24 60.17113-11.264 32.50087-2.871652 67.806609 21.882435 92.137739l178.509913 175.638261-41.405217 243.378087c-5.810087 33.925565 9.282783 68.719304 38.555826 88.687304 28.627478 19.255652 67.005217 21.370435 97.836522 5.164522l211.745391-112.39513 211.878957 112.417391c13.712696 7.234783 29.094957 11.063652 44.521739 11.063652 19.010783 0 37.420522-5.609739 53.337043-16.317217 29.139478-19.878957 44.210087-54.650435 38.4-88.576l-41.382957-243.400348 178.532174-175.638261C1022.048294 451.917913 1030.440641 416.589913 1019.109859 384zM966.062207 444.527304l-195.094261 191.955478 45.278609 266.329043c2.938435 17.096348-4.585739 34.05913-19.478261 44.232348-15.248696 10.24-35.817739 11.330783-52.045913 2.782609L512.00725 826.323478l-232.537043 123.436522c-16.406261 8.637217-36.997565 7.479652-52.045913-2.671304-15.048348-10.262261-22.572522-27.247304-19.634087-44.343652l45.30087-266.284522-195.072-191.955478c-12.377043-12.154435-16.606609-29.718261-11.063652-45.723826 5.765565-16.384 20.524522-28.182261 38.622609-30.786783l266.48487-39.112348 115.97913-237.122783c7.880348-16.11687 25.154783-26.534957 43.987478-26.534957 18.899478 0 36.173913 10.395826 44.054261 26.512696l115.95687 237.122783 266.418087 39.023304c18.075826 2.671304 32.901565 14.514087 38.64487 30.809043C982.668815 414.786783 978.43925 432.328348 966.062207 444.527304zM509.046555 376.898783c-45.590261 0-82.320696 13.913043-109.122783 41.316174-44.744348 45.746087-43.78713 112.194783-43.720348 115.021913 0.26713 12.109913 10.173217 21.726609 22.238609 21.726609 0.133565 0 0.289391 0 0.422957 0 12.265739-0.222609 22.016-10.373565 21.837913-22.639304 0-0.512-0.400696-51.066435 31.254261-83.18887 18.098087-18.387478 44.054261-27.692522 77.06713-27.692522 12.288 0 22.26087-9.97287 22.26087-22.26087S521.334555 376.898783 509.046555 376.898783z" p-id="6346" fill="#008080"></path></svg>';
  const IconStarFill =
    '<svg viewBox="0 0 1071 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><title>已收藏</title><path d="M595.741436 18.32575a97.371215 97.371215 0 0 1 23.150006 23.563834l135.589417 195.61877a48.685607 48.685607 0 0 0 27.823824 19.401215l214.411416 55.47725a97.371215 97.371215 0 0 1 54.138395 151.850409l-143.69557 195.910885a48.685607 48.685607 0 0 0-9.420665 29.381764l2.677708 216.504896a97.371215 97.371215 0 0 1-126.533894 94.109279l-219.133919-68.817106a48.685607 48.685607 0 0 0-28.821879-0.121714l-231.402693 70.740188a97.371215 97.371215 0 0 1-125.852295-93.111224v-220.78923a48.685607 48.685607 0 0 0-8.203525-27.069198L26.801427 461.194378a97.371215 97.371215 0 0 1 55.574621-148.150304l208.301371-56.158848a48.685607 48.685607 0 0 0 26.82577-18.573559l142.332373-197.809623a97.371215 97.371215 0 0 1 135.905874-22.176294z m104.1872 535.298254c-37.926088 42.940706-89.16769 64.265002-157.49794 64.265001-68.963163 0-123.564072-21.859838-166.821234-66.090712a48.685607 48.685607 0 0 0-69.620419 68.062479c62.025464 63.437347 141.845517 95.423791 236.465995 95.423791 95.277734 0 173.320763-32.521986 230.453323-97.249501a48.685607 48.685607 0 0 0-73.004068-64.411058z" p-id="2830" fill="#008080"></path></svg>';
  const LocalCollection = {
    playPageHref: "",
    init() {
      const modal = $(
        `<a class='ddrk-tools__modal' title='ddrk助手功能: 点击打开新标签（可取消）'></a>`
      );
      if ($(".post-box").length) {
        $(".post-box").each(function () {
          modal.attr("href", $(this).data("href"));
          $(this).append(modal.clone(true));
        });
      } else {
        this.playPageHref =
          window.location.origin +
          "/" +
          window.location.pathname.split("/")[1] +
          "/";
      }
      this.reloadCollectButton();
      this.bindEvent();
    },
    bindEvent() {
      const self = this;
      // 点击打开新页签
      $(".post-box").on("click", ".ddrk-tools__modal", function (e) {
        console.log("opentab: ", Settings.getValueById(2));
        if (Settings.getValueById(2)) {
          window.open($(this).parent().data("href"));
        } else {
          window.location.href = $(this).parent().data("href");
        }
        e.stopPropagation();
        return false; // 阻止a标签默认行为
      });
      $(".post-box").on("click", ".btn_col-default", function (e) {
        e.stopPropagation();
      });
      $(".post-box").on("click", ".btn_col-add", function (e) {
        const href = $(this).parent().data("href");
        const name = $(this).parent().find(".post-box-title a").text();
        if (!colList.value.find((item) => item.href === href)) {
          colList.value.push({
            name: name.indexOf("(") > -1 ? name.split("(")[0] : name,
            href,
          });
          /** 一个月后常量替换该字段， 当前版本0.5 */
          Store.setValue("ddrk-collection", JSON.stringify(colList.value));
          Store.setValue(STORE_COLLECTION_KEY, JSON.stringify(colList.value));
        }
        self.toggleButton($(this), 1);
      });
      $(".post-box").on("click", ".btn_col-remove", function (e) {
        const href = $(this).parent().data("href");
        const index = colList.value.findIndex((item) => item.href === href);
        self.handleColDel(index);
        self.toggleButton($(this), 0);
      });
      // 播放页点击
      $("#ddrk-tools").on("click", ".btn_col-remove", function (e) {
        const index = colList.value.findIndex(
          (item) => item.href === self.playPageHref
        );
        self.handleColDel(index);
        self.toggleButton($(this), 0);
      });
      $("#ddrk-tools").on("click", ".btn_col-add", function (e) {
        const name = $(".post-title").text();
        if (!colList.value.find((item) => item.href === self.playPageHref)) {
          colList.value.push({
            name: name.indexOf("(") > -1 ? name.split("(")[0] : name,
            href: self.playPageHref,
          });
          /** 一个月后常量替换该字段， 当前版本0.5 */
          Store.setValue("ddrk-collection", JSON.stringify(colList.value));
          Store.setValue(STORE_COLLECTION_KEY, JSON.stringify(colList.value));
        }
        self.toggleButton($(this), 1);
      });
    },
    toggleButton(tempBtn, tag) {
      if (tag === 0) {
        tempBtn.addClass("btn_col-add");
        tempBtn.removeClass("btn_col-remove");
        tempBtn.html(IconStarSlim);
      } else {
        tempBtn.addClass("btn_col-remove");
        tempBtn.removeClass("btn_col-add");
        tempBtn.html(IconStarFill);
      }
    },
    // 刷新页面收藏按钮
    reloadCollectButton() {
      const self = this;
      if ($(".post-box").length) {
        $(".post-box").each(function () {
          let tempBtn = $(this).find(".btn_col-default");
          if (!tempBtn.length) {
            tempBtn = $(
              `<span class="btn_col-default btn_col-remove">${IconStarFill}</span>`
            );
            $(this).append(tempBtn);
          }
          if (
            !colList.value.find((item) => item.href === $(this).data("href"))
          ) {
            self.toggleButton(tempBtn, 0);
          } else {
            self.toggleButton(tempBtn, 1);
          }
        });
      } else {
        let tempBtn = $(".btn_col-playpage");
        if (!tempBtn.length) {
          tempBtn = $(
            `<span class="btn_col-playpage btn_col-remove">${IconStarFill}</span>`
          );
          $("#ddrk-tools").append(tempBtn);
        }
        if (!colList.value.find((item) => item.href === this.playPageHref)) {
          self.toggleButton(tempBtn, 0);
        } else {
          self.toggleButton(tempBtn, 1);
        }
      }
    },
    // 删除已收藏
    handleColDel(index) {
      if (index !== -1) {
        colList.value.splice(index, 1);
        Store.setValue("ddrk-collection", JSON.stringify(colList.value));
        Store.setValue(STORE_COLLECTION_KEY, JSON.stringify(colList.value));
      }
    },
  };
  LocalCollection.init();

  await Common.sleep(50); // 等待video初始化

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
    },
    initPlayer() {
      this.player = WD.videojs?.getAllPlayers()[0];
      console.time("视频源数据加载完成");
      // 监听
      this.player?.one("canplaythrough", async (e) => {
        console.timeEnd("视频源数据加载完成");
        await Common.sleep(200);
        this.nextType === "auto" && this.restoreVideoModel();
      });
      this.player?.on("ended", async () => {
        console.log("ended");
        console.log("autonext:", Settings.getValueById(1));
        console.log("lastEp:", this.isLastEP());
        if (!Settings.getValueById(1)) return;
        if (this.isLastEP()) return this.setResume(TIME_END);
        this.getCurrentVideoModel(); // 在下一集之前获取当前video状态
        this.handleToNext();
        this.nextType = "auto";
        await Common.sleep(200);
        watchRecord.initPlayer();
        this.initPlayer();
        this.handleToPlay();
      });
    },
    bindEvent() {
      // 主动点击下一集
      $(WD.document).on(
        "click",
        ".wp-playlist-tracks .wp-playlist-item, icon-angle-right",
        async (e) => {
          await Common.sleep(200);
          this.initPlayer();
          this.nextType = "hand";
        }
      );
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
        this.setResume(0);
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
        $(".vjs-picture-in-picture-control").trigger("click");
      } else if (this.playerModel.isFullWindow) {
        (
          this.player.controlBar.childNameIndex_.theaterModeToggle || {}
        ).handleClick();
        // this.player.controlBar.childNameIndex_.theaterModeToggle.el_.click();
      }
    },
    isLastEP() {
      return $(".wp-playlist-item:last-child").hasClass("wp-playlist-playing");
    },
    setResume(value = 0) {
      localStorage.setItem(
        window.location.href.replace("https://ddrk.me", "videojs-resume:"),
        value
      );
    },
  };
  autoPlayNext.init();

  /**
   * 播放页上次观看记录提示
   */
  const watchRecord = {
    recordData: {},
    init() {
      // 有播放器则继续
      if (WD.videojs?.getAllPlayers()[0]) {
        this.initPlayer();
        this.bindEvent();
        this.recordData = this.getRecord();
        if (!Settings.getValueById(3)) return;
        const curPageInfo = this.parseUrl();
        const lastInfo = this.recordData[curPageInfo.enName];
        // console.log("-curInfo--", curPageInfo);
        // console.log("-recordData--", this.recordData);
        if (
          lastInfo &&
          (curPageInfo.season !== lastInfo?.season ||
            curPageInfo.ep !== lastInfo?.ep)
        ) {
          const season = lastInfo.season ? `S${lastInfo.season} - ` : "";
          const ep = lastInfo.ep ? `E${lastInfo.ep}` : "";
          this.showMsgBox(
            "上次观看到：" + `<a href="${lastInfo.href}">${season}${ep}</a>`
          );
        }
      }
    },
    initPlayer() {
      const player = WD.videojs?.getAllPlayers()[0];
      player?.one("canplay", () => this.setRecord());
    },
    getRecord() {
      return JSON.parse(Store.getValue(STORE_RECORD_KEY) || "{}");
    },
    setRecord() {
      const escData = this.parseUrl();
      // 防止电影和只有一季的保存第一集
      if (escData.ep > 1 || escData.season >= 1) {
        this.recordData[escData.enName] = escData;
        Store.setValue(STORE_RECORD_KEY, JSON.stringify(this.recordData));
      }
    },
    parseUrl() {
      const info = window.location.pathname.split("/");
      return {
        enName: info[1],
        season:
          info.length > 3 && !isNaN(info[2])
            ? info[2]
            : $(".post-page-numbers").text()
              ? "1"
              : "",
        ep: window.location.search.replace("?ep=", ""),
        href: window.location.href,
      };
    },
    bindEvent() {
      // 主动点击下一集
      $(WD.document).on(
        "click",
        ".wp-playlist-tracks .wp-playlist-item, icon-angle-right",
        (e) => this.initPlayer()
      );
    },
    async showMsgBox(msg, url) {
      $("body").append(
        $(
          `<div id="msg-box">
            <div class="msg-box_wrapper">
              <div>${msg}</div>
              <!-- <div class="msg-box_btns"><button data-url="${url}">跳转</button></div> -->
            </div>
            <div id="msg-arrow" data-popper-arrow></div>
          </div>`
        )
      );
      const popover = new Popper.createPopper(
        $("#vjsp_html5_api")[0],
        $("#msg-box")[0],
        {
          placement: "top",
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 10],
              },
            },
            {
              name: "flip",
              options: {
                fallbackPlacements: ["top", "bottom"],
              },
            },
          ],
        }
      );
      setTimeout(() => {
        popover.destroy();
        $("#msg-box").remove();
      }, 8000);
    },
  };
  watchRecord.init();

  /** 小窗播放 */
  const PlayInSmallWindow = {
    player: null,
    isPlaying: false,
    offsetTop: 0,
    eleHeight: 0,
    init() {
      // 有播放器则继续
      if (WD.videojs?.getAllPlayers()[0]) {
        this.offsetTop = $(".wp-video-playlist").offset().top;
        this.eleHeight = $("#vjsp_html5_api").height();
        this.initPlayer();
        this.bindEvent();
        $(".wp-video-playlist").prepend(
          $(`<div class="ddrk-tools__video-placeholder" ></div>`)
        );
      }
    },
    initPlayer() {
      this.player = WD.videojs?.getAllPlayers()[0];
      this.player?.on("playing", () => {
        // console.log("视频播放中");
        this.isPlaying = true;
      });
      this.player?.on("pause", () => {
        // console.log("视频暂停播放");
        this.isPlaying = false;
      });
      this.player?.on("ended", () => {
        // console.log("视频播放结束");
        this.isPlaying = false;
      });
    },
    bindEvent() {
      $(window).scroll(() => {
        if (
          !this.isPlaying &&
          !$("#vjsp").hasClass("ddrk-tools__video-window-small")
        ) {
          return;
        }
        //开始监听滚动条
        const target = this.offsetTop + this.eleHeight * 0.8;
        if (
          target >= $(window).scrollTop() &&
          this.offsetTop < $(window).scrollTop() + $(window).height()
        ) {
          // console.log("div在可视范围");
          $(".ddrk-tools__video-placeholder").css({
            width: 0,
            height: 0,
          });
          $("#vjsp").removeClass("ddrk-tools__video-window-small");
        } else if (!$("#vjsp").hasClass("ddrk-tools__video-window-small")) {
          if (!Settings.getValueById(4)) return;
          $(".ddrk-tools__video-placeholder").css({
            width: $("#vjsp").outerWidth(),
            height: $("#vjsp").outerHeight(),
          });
          $("#vjsp").addClass("ddrk-tools__video-window-small");
        }
      });
    },
  };
  PlayInSmallWindow.init();

  //window.videojs.getAllPlayers()[0].getMedia() 获取文件
})();
