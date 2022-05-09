// ==UserScript==
// @name         ddrk助手
// @namespace    king
// @version      0.3
// @description  1.去广告 2.收藏功能 3.历史观看记录
// @author       hero-king
// @match        https://ddrk.me/*
// @icon         https://ddrk.me/favicon-32x32.png
// @grant        none
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.js
// ==/UserScript==

(function () {
  "use strict";
  /*去广告*/
  $(".cfa_popup").css({ height: "0px" });
  $("#iaujwnefhw").css({ height: "0", overflow: "hidden" });
  $("#kasjbgih").css({ height: "0", overflow: "hidden" });

  const styleStr = `<style>
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
      transition: width .8s;
    }
    .col_list .col_list_arrow{
      position: absolute;
      left: -16px;
      top: 0;
      width: 16px;
      height: 54px;
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
    .col_list-ul .col_item .icon_del{
      border-radius: 100%;
      width: 16px;
      height: 16px;
      line-height: 1;
      display: none;
      text-align: center;
      color: #fff;
    }
    <style>`;
  $("head").append(styleStr);

  const jsonText = window.localStorage.getItem("ddrk-collection");
  let list = [];
  if (jsonText) {
    list = JSON.parse(jsonText);
  }

  const div = $("<div></div>");
  div.css({
    position: "absolute",
    left: "0",
    top: "0",
    right: "0",
    bottom: "0",
    "text-align": "right",
  });
  div.addClass("laksjdflakjsd");
  $(".post-box").on("click", ".btn_default", function (e) {
    e.stopPropagation();
  });
  $(".post-box").on("click", ".btn_add", function (e) {
    const href = $(this).parent().parent().data("href");
    const name = $(this).parent().parent().find(".post-box-title a").text();
    if (!list.find((item) => item.href === href)) {
      list.push({
        name: name.indexOf("(") > -1 ? name.split("(")[0] : name,
        href,
      });
      window.localStorage.setItem("ddrk-collection", JSON.stringify(list));
    }
    reloadCollect(1, $(this));
    reloadColList();
  });
  $(".post-box").on("click", ".btn_remove", function (e) {
    const href = $(this).parent().parent().data("href");
    const index = list.findIndex((item) => item.href === href);
    if (index !== -1) {
      list.splice(index, 1);
      window.localStorage.setItem("ddrk-collection", JSON.stringify(list));
    }
    reloadCollect(0, $(this));
    reloadColList();
  });
  $(".post-box").on("click", ".laksjdflakjsd", function (e) {
    window.open($(this).parent().data("href"));
    e.stopPropagation();
  });
  $("body").on("click", ".col_list-ul li", function (e) {
    window.open($(this).data("href"));
    e.stopPropagation();
  });
  $("body").on("click", ".col_list-ul li .icon_del", function (e) {
    const href = $(this).parent().data("href");
    const index = list.findIndex((item) => item.href === href);
    if (index !== -1) {
      list.splice(index, 1);
      window.localStorage.setItem("ddrk-collection", JSON.stringify(list));
    }
    reloadCollect();
    reloadColList();
    e.stopPropagation();
  });

  const btn = $(
    '<span class="btn_default btn_remove" style="font-size:22px;color: #2EBF8B;padding:6px;background-color: rgba(0,0,0,0.4);position: absolute;top:0;box-shadow: 0px 0px 5px rgba(0,0,0,0.4);line-height: 1.2;user-select:none;">★</span>'
  );
  $(".post-box").each(function () {
    const tempBtn = btn.clone(true);
    if (!list.find((item) => item.href === $(this).data("href"))) {
      tempBtn.addClass("btn_add");
      tempBtn.removeClass("btn_remove");
      tempBtn.text("☆");
    }
    div.html(tempBtn);
    $(this).append(div.clone(true));
  });

  // 收藏列表
  const colOuter = $("<div class='col_list'></div>");
  const title = $("<h6>收藏夹</h6>");
  const arrowIcon = $(
    '  <svg class="col_list_arrow" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" ><path fill="currentColor" d="M529.408 149.376a29.12 29.12 0 0 1 41.728 0 30.592 30.592 0 0 1 0 42.688L259.264 511.936l311.872 319.936a30.592 30.592 0 0 1-.512 43.264 29.12 29.12 0 0 1-41.216-.512L197.76 534.272a32 32 0 0 1 0-44.672l331.648-340.224zm256 0a29.12 29.12 0 0 1 41.728 0 30.592 30.592 0 0 1 0 42.688L515.264 511.936l311.872 319.936a30.592 30.592 0 0 1-.512 43.264 29.12 29.12 0 0 1-41.216-.512L453.76 534.272a32 32 0 0 1 0-44.672l331.648-340.224z"  ></path></svg>;'
  );
  const ul = $("<ul class='col_list-ul'></ul>");
  colOuter.append(title);
  colOuter.append(arrowIcon);
  colOuter.append(ul);
  $("body").append(colOuter);
  colOuter
    .mouseenter(function () {
      colOuter.css({ width: "300px" });
      ul.css({ overflow: "auto" });
    })
    .mouseleave(function () {
      colOuter.css({ width: "0" });
      ul.css({ overflow: "hidden" });
    });
  reloadColList();
  function reloadColList() {
    ul.html("");
    list.forEach((item, index) => {
      const li = $("<li class='col_item'></li>");
      const span = $(`<span>${index + 1}. ${item.name}</span>`);
      const del = $("<span class='icon_del'>x</span>");
      li.append(span);
      li.append(del);
      li.data("href", item.href);
      li.mouseenter(function () {
        $(this).find(".icon_del").css({ display: "inline-block" });
        $(this).css({ "box-shadow": "0 0 5px rgba(32,178,170,0.2)", "border-color": "rgba(225,255,255,0.4)" });
      }).mouseleave(function () {
        $(this).find(".icon_del").css({ display: "none" });
        $(this).css({ "box-shadow": "none", "border-color": 'transparent' });
      });
      ul.append(li);
    })
  }

  function reloadCollect(tag, tempBtn) {
    if (tempBtn) {
      if (tag === 0) {
        tempBtn.addClass("btn_add");
        tempBtn.removeClass("btn_remove");
        tempBtn.text("☆");
      } else {
        tempBtn.addClass("btn_remove");
        tempBtn.removeClass("btn_add");
        tempBtn.text("★");
      }
    } else {
      $(".post-box").each(function () {
        const tempBtn = $(this).find(".btn_default");
        if (!list.find((item) => item.href === $(this).data("href"))) {
          tempBtn.addClass("btn_add");
          tempBtn.removeClass("btn_remove");
          tempBtn.text("☆");
        } else {
          tempBtn.addClass("btn_remove");
          tempBtn.removeClass("btn_add");
          tempBtn.text("★");
        }
      });
    }
  }

  /**
   * 历史记录功能
   */
  let historyUl = null;
  async function initLocal() {
    const jsonText = window.localStorage.getItem("ddrk-history");
    let jsonList = [];
    if (jsonText) {
      jsonList = JSON.parse(jsonText);
    }

    const localData = getLocalStorageData();
    const his = formatLocalData(localData);
    const filterList = filterLocalData(his);
    let res = compareLocalData(jsonList, filterList);
    // console.log("history-----------------", his);
    for (const item of res) {
      if (!item.name) {
        const name = await getDramaName(item.url);
        item.name = name.indexOf("(") > -1 ? name.split("(")[0] : name;
      }
    }
    // 过滤name不存在的
    res = res.filter(item => item.name)
    // console.log("result----------------", res);
    window.localStorage.setItem("ddrk-history", JSON.stringify(res));
    historyUl = createHtml();
    reloadHistoryList(res);
  }
  initLocal();
  // 对比
  function compareLocalData(myList, ddrkList) {
    return ddrkList.map((ddrkItem) => {
      const innerItem =
        myList.find(
          (item) =>
            item.enName === ddrkItem.enName && item.season === ddrkItem.season
        ) || {};
      return {
        ...innerItem,
        ...ddrkItem,
      };
    });
  }
  function formatLocalData(local) {
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
  }
  // 去重
  function filterLocalData(params) {
    const result = params.reduce((res, cur) => {
      const innerItem = res.find(
        (item) => item.enName === cur.enName && item.season === cur.season
      );
      if (innerItem) {
        if (+cur.ep > +innerItem.ep) {
          res.splice(
            res.findIndex(
              (item) => item.enName === cur.enName && item.season === cur.season
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
  }
  function getLocalStorageData() {
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
  }
  function getDramaName(url) {
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
        type: 'get',
        success: function (result) {   //成功后回调
          const name = $(result).find(".post-title").text();
          resolve(name);
        },
        error: function (e) {    //失败后回调
          resolve('');
        }
      })
    });
  }
  function createHtml(params) {
    const colOuter = $("<div class='col_list'></div>");
    colOuter.css({
      top: "135px",
      "z-index": "99",
    });
    const title = $("<h6>观看记录</h6>");
    const arrowIcon = $(
      '  <svg class="col_list_arrow" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" ><path fill="currentColor" d="M529.408 149.376a29.12 29.12 0 0 1 41.728 0 30.592 30.592 0 0 1 0 42.688L259.264 511.936l311.872 319.936a30.592 30.592 0 0 1-.512 43.264 29.12 29.12 0 0 1-41.216-.512L197.76 534.272a32 32 0 0 1 0-44.672l331.648-340.224zm256 0a29.12 29.12 0 0 1 41.728 0 30.592 30.592 0 0 1 0 42.688L515.264 511.936l311.872 319.936a30.592 30.592 0 0 1-.512 43.264 29.12 29.12 0 0 1-41.216-.512L453.76 534.272a32 32 0 0 1 0-44.672l331.648-340.224z"  ></path></svg>;'
    );
    const ul = $("<ul class='col_list-ul'></ul>");
    colOuter.append(title);
    colOuter.append(arrowIcon);
    colOuter.append(ul);
    $("body").append(colOuter);
    colOuter
      .mouseenter(function () {
        colOuter.css({ width: "300px" });
        ul.css({ overflow: "auto" });
      })
      .mouseleave(function () {
        colOuter.css({ width: "0" });
        ul.css({ overflow: "hidden" });
      });
    return ul;
  }
  function reloadHistoryList(hisList) {
    historyUl.html("");
    hisList.forEach((item, index) => {
      const li = $(
        "<li class='col_item' style='word-break: break-all;' ></li>"
      );
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
      const span = $(`<span>${index + 1}. ${item.name} ${season}${ep}</span>`);
      const span2 = $(`<span style='font-size: 12px;color: #fff;margin-left: 20px;white-space: nowrap;'>${timeStr}</span>`)
      //   const del = $("<span class='icon_del'>x</span>");
      //   li.append(del);
      li.append(span);
      li.append(span2);
      li.data("href", item.url);
      li.mouseenter(function () {
        $(this).css({ "box-shadow": "0 0 5px rgba(32,178,170,0.2)", "border-color": "rgba(225,255,255,0.4)" });
        // $(this).find(".icon_del").css({ display: "inline-block" });
      }).mouseleave(function () {
        $(this).css({ "box-shadow": "none", "border-color": 'transparent' });
        // $(this).find(".icon_del").css({ display: "none" });
      });
      historyUl.append(li);
    });
  }
})();
