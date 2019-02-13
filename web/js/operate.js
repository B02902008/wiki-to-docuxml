// Function : initial window variable
function window_variable_initial() {
    window.corpus_list = null;
    window.corpus_tree = null;
    window.corpus_target = null;
    window.table_wiki_list = null;
    window.table_wiki_target = null;
    window.entire_book_check_queue = null;
}

//Function : hash function
function hash(s) {
    let h = 1;
    for (let i = 0; i < s.length; i ++)
        h = Math.imul(h + s.charCodeAt(i) | 0, 2654435761);
    return (h ^ h >>> 17) >>> 0;
}

// Function : create and config DOM element
function elementFactory(data) {
    if (!data.hasOwnProperty("type"))
        return null;
    let el = document.createElement(data.type);
    if (data.hasOwnProperty("class"))
        $(el).addClass(data.class);
    if (data.hasOwnProperty("html"))
        $(el).html(data.html);
    if (data.hasOwnProperty("css"))
        $(el).css(data.css);
    if (data.hasOwnProperty("attr")) {
        for (let key in data.attr) {
            if (!data.attr.hasOwnProperty(key))
                continue;
            $(el).attr(key, data.attr[key]);
        }
    }
    if (data.hasOwnProperty("on")) {
        for (let key in data.on) {
            if (!data.on.hasOwnProperty(key))
                continue;
            $(el).on(key, { target: el }, data.on[key]);
        }
    }
    return el;
}

// Function : make sure url is decoded
function confirm_decode(s) {
    let ss = decodeURIComponent(s);
    return (s === ss) ? s : ss;
}

// Function : check synchronize between wiki document table and docuXML
function check_sync(content, btn_y, btn_n, callback) {
    let sync = true;
    $('#wiki-table-body tr').each(function() {
        let st = $(this).attr("state");
        if (st !== "0" && st !== "4")
            sync = false;
    });
    if (!sync) {
        let dialog = elementFactory({ type: "div", html: content });
        // no button
        $(dialog).append(elementFactory({
            type: "button",
            class: "btn btn-default btn-xs",
            css: { margin: "10px 20px 0 0" },
            html: btn_n,
            on: { click: function() { $.unblockUI(); callback(false); } }
        }));
        // yes button
        $(dialog).append(elementFactory({
            type: "button",
            class: "btn btn-default btn-xs",
            css: { margin: "10px 0 0 20px" },
            html: btn_y,
            on: { click: function() { $.unblockUI(); callback(true); } }
        }));
        $.blockUI({
            message: $(dialog),
            css: { width: '300px', height: '120px', top: 'calc(50% - 60px)', left: 'calc(50% - 150px)', padding: '10px 0 0 0' }
        });
    } else {
        callback(true);
    }
}

// Function : delete button click function
function click_delete_btn(e) {
    if ($(e.data.target).hasClass("disabled"))
        return;
    let row = $("#" + ($(e.data.target).attr("key")));
    let node = window.corpus_tree.access_child_with_full_position($(row).attr("pos"));
    node.set_state((parseInt($(row).attr("state")) + 2) % 4);
    refresh_wiki_table();
}

// Function : related entry item click function
function click_related_entry_item(e) {
    let self = e.data.target;
    let name = $(self).attr("title");
    let url = $(self).attr("url");
    let parent;
    if ($(self).parent().attr("id") === "related-entry-src-list")
        parent = $("#related-entry-dst-list");
    else
        parent = $("#related-entry-src-list");
    $(self).remove();
    $(parent).append(elementFactory({
        type: "div",
        attr: { url: url, title: name },
        class: "related-entry-item select-disable",
        html: name,
        on: { click: click_related_entry_item }
    }));
}

// Function add related entry to wiki document table
function add_related_entry() {
    $('#related-entry-dst-list div').each(function() {
        let name = $(this).html();
        let url = $(this).attr("url");
        let node = window.corpus_tree.access_child_with_full_position(window.table_wiki_target);
        if (!window.table_wiki_list.includes(url))
            node.add_child(name, url);
    });
    refresh_wiki_table();
    $.unblockUI();
}

// Function : create block ui dialog for related entry
function create_related_entry_dialog(data) {
    let dialog = elementFactory({ type: "div" });
    let lst_wrap = elementFactory({ type: "div", css: { margin: "5px 0 5px 0" } });
    let src_lst = elementFactory({ type: "div", attr: { id: "related-entry-src-list" }, class: "dialog-list" });
    let dst_lst = elementFactory({ type: "div", attr: { id: "related-entry-dst-list" }, class: "dialog-list" });
    let arrow_wrap = elementFactory({ type: "div", attr: { id: "arrow-container" } });
    let arrow_r = elementFactory({ type: "div", attr: { id: "arrow-wrap-r" }, class: "select-disable" });
    let arrow_l = elementFactory({ type: "div", attr: { id: "arrow-wrap-l" }, class: "select-disable" });
    let btn_wrap = elementFactory({ type: "div", css: { margin: "5px 0 5px 0" } });

    // query result show
    $(dialog).append(elementFactory({
        type: "div",
        css: { margin: "5px 0 5px 0" },
        html: "找到 " + Object.keys(data).length + " 個相關條目"
    }));

    // append wrapper for two list and arrow
    $(lst_wrap).append(src_lst);
    $(lst_wrap).append(arrow_wrap);
    $(lst_wrap).append(dst_lst);
    $(dialog).append(lst_wrap);
    // add query result to src list
    let sorted_keys = Object.keys(data).sort();
    for (let idx in sorted_keys) {
        let key = sorted_keys[idx];
        if (!data.hasOwnProperty(key))
            continue;
        $(src_lst).append(elementFactory({
            type: "div",
            attr: { url: data[key], title: decodeURIComponent(key) },
            class: "related-entry-item select-disable",
            html: decodeURIComponent(key),
            on: { click: click_related_entry_item }
        }));
    }
    // arrow right
    $(arrow_r).append(elementFactory({ type: "div", attr: { id: "arrow-tail-r" } }));
    $(arrow_r).append(elementFactory({ type: "div", attr: { id: "arrow-body-r" }, html: "加入" }));
    $(arrow_r).append(elementFactory({ type: "div", attr: { id: "arrow-head-r" } }));
    $(arrow_wrap).append(arrow_r);
    // arrow left
    $(arrow_l).append(elementFactory({ type: "div", attr: { id: "arrow-head-l" } }));
    $(arrow_l).append(elementFactory({ type: "div", attr: { id: "arrow-body-l" }, html: "刪去" }));
    $(arrow_l).append(elementFactory({ type: "div", attr: { id: "arrow-tail-l" } }));
    $(arrow_wrap).append(arrow_l);

    // query result add and cancel button
    $(btn_wrap).append(elementFactory({
        type: "button",
        attr: { id: "related-entry-dialog-cancel" },
        class: "btn btn-default btn-xs",
        css: { margin: "0 20px 0 0" },
        html: "取消",
        on: { click: $.unblockUI }
    }));
    $(btn_wrap).append(elementFactory({
        type: "button",
        attr: { id: "related-entry-dialog-add" },
        class: "btn btn-default btn-xs",
        css: { margin: "0 0 0 20px" },
        html: "加入",
        on: { click: add_related_entry }
    }));
    $(dialog).append(btn_wrap);

    $.blockUI({
        message: $(dialog),
        css: { width: "550px", height: "330px", top: 'calc(50% - 165px)', left: 'calc(50% - 275px)', cursor: 'auto' }
    });
}

// Function : related entry button click function
function click_related_entry_btn(e) {
    if ($(e.data.target).hasClass("disabled"))
        return;
    let row = $("#" + ($(e.data.target).attr("key")));
    let url = $(row).attr("url");
    window.table_wiki_target = $(row).attr("pos");
    $.blockUI({ message: "正在取得相關條目..." });
    window.get_all_links(url, function(result) {
        if (result.status) {
            create_related_entry_dialog(result.data);
        } else {
            $.blockUI({message: "找不到相關條目<br>原因：" + result.data});
            setTimeout($.unblockUI, 3000);
        }
    });
}

// Function : recursively add entry
function recursive_add(key) {
    let pattern = new RegExp('https:\\/\\/((.*\\/)+wiki\\/)([^#]+)(#.*)*');
    let row = $("#" + key);
    let url = $(row).attr("url");
    let pos = $(row).attr("pos");
    let name = decodeURIComponent(pattern.exec(url)[3]).replace(/_/g, ' ');
    let node = window.corpus_tree.access_child_with_full_position(pos);
    $("#entire_book_sub_book_name").html(name);
    window.get_all_links(url, function(result) {
        if (result.status) {
            let sorted_keys = Object.keys(result.data).sort();
            for (let idx in sorted_keys) {
                let key = sorted_keys[idx];
                if (!result.data.hasOwnProperty(key))
                    continue;
                if ((key.indexOf(name) !== -1) && (!window.table_wiki_list.includes(result.data[key]))) {
                    window.entire_book_check_queue.push(hash(result.data[key]));
                    node.add_child(key, result.data[key]);
                }
            }
            refresh_wiki_table();
        }
        window.entire_book_check_queue.shift();
        if (window.entire_book_check_queue.length !== 0)
            recursive_add(window.entire_book_check_queue[0]);
        else
            $.unblockUI();
    });
}

// Function : add entire book button click function
function click_add_entire_book_btn(e) {
    if ($(e.data.target).hasClass("disabled"))
        return;
    window.entire_book_check_queue = [$(e.data.target).attr("key")];
    $.blockUI({ message: "正在取得「<span id='entire_book_sub_book_name'></span>」下的目錄..." });
    recursive_add($(e.data.target).attr("key"));
}

// Function : copy link button click function
function click_copy_link_btn(e) {
    let url = $("#" + ($(e.data.target).attr("key"))).attr("url");
    let tmp = elementFactory({
        type: "textarea",
        attr: { readonly: "" },
        css: { position: "absolute", left: "-9999px"}
    });
    $(tmp).val(url);
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    document.body.removeChild(tmp);
    $.blockUI({
        message: "網址已複製到剪貼簿",
        centerY: 0,
        css: { top: '60px', left: '', right: '10px', width: '200px' }
    });
    setTimeout($.unblockUI, 500);
}

// Function : error message button click function
function click_error_message_btn(e) {
    let msg = $("#" + ($(e.data.target).attr("key"))).attr("msg");
    $.blockUI({ message: msg });
    setTimeout($.unblockUI, 3000);
    $('.blockOverlay').click($.unblockUI);
}

// Function : create new row in wiki document table
function create_wiki_table_row(data) {
    let pattern = new RegExp('https:\\/\\/((.*\\/)+wiki\\/)([^#]+)(#.*)*');
    let key = hash(data.url);
    let src = pattern.exec(data.url)[1];
    let entry = (data.name !== null) ? data.name : decodeURIComponent(pattern.exec(data.url)[3]);
    let cell, btn;
    let icon_type = ["ok", "hourglass", "hourglass", "hourglass", "remove"];
    let icon_color = ["green", "black", "black", "black", "red"];

    // config row
    let row = elementFactory({
        type: "tr",
        attr: { id: key, url: data.url, pos: data.pos, state: data.state.toString(), msg: data.msg },
        css: { 'text-decoration-line': (((data.state === 2) || (data.state === 3)) ? " line-through" : "none") }
    });

    // status
    cell = elementFactory({ type: "td", css: { width: "50px",'text-align': "center" } });
    $(cell).append(elementFactory({
        type: "span",
        class: "glyphicon glyphicon-" + icon_type[data.state],
        css: { color: icon_color[data.state] }
    }));
    $(row).append(cell);

    // source
    $(row).append(elementFactory({ type: "td", css: { width: "200px", 'text-align': "left" }, html: src }));

    // entry
    $(row).append(elementFactory({ type: "td", css: { 'text-align': "left" }, html: entry }));

    // button
    cell = elementFactory({ type: "td", class: "select-disable", css: { width: "150px", 'text-align': "left" } });
    $(row).append(cell);
    // delete button
    btn = elementFactory({
        type: "div",
        attr: { key: key, title: "刪除此條目" },
        class: "table-tool-btn" + ((data.state === 4) ? " disabled" : ""),
        on: { click: click_delete_btn }
    });
    $(btn).append(elementFactory({ type: "span", class: "glyphicon glyphicon-trash" }));
    $(cell).append(btn);
    // related entry button
    btn = elementFactory({
        type: "div",
        attr: { key: key, title: "增加相關條目" },
        class: "table-tool-btn" + ((data.state === 4) ? " disabled" : ""),
        on: { click: click_related_entry_btn }
    });
    $(btn).append(elementFactory({ type: "span", class: "glyphicon glyphicon-list-alt" }));
    $(cell).append(btn);
    // add entire book button
    btn = elementFactory({
        type: "div",
        attr: { key: key, title: "加入整本文獻" },
        class: "table-tool-btn" + ((data.state === 4) ? " disabled" : ""),
        on: { click: click_add_entire_book_btn }
    });
    $(btn).append(elementFactory({ type: "span", class: "glyphicon glyphicon-book" }));
    $(cell).append(btn);
    // copy link button
    btn = elementFactory({
        type: "div",
        attr: { key: key, title: "複製此條目連結" },
        class: "table-tool-btn",
        on: { click: click_copy_link_btn }
    });
    $(btn).append(elementFactory({ type: "span", class: "glyphicon glyphicon-duplicate" }));
    $(cell).append(btn);
    // error message button
    btn = elementFactory({
        type: "div",
        attr: { key: key, title: "查看錯誤訊息" },
        class: "table-tool-btn",
        css: { display: ((data.state === 4) ? " inline-block" : "none") },
        on: { click: click_error_message_btn }
    });
    $(btn).append(elementFactory({ type: "span", class: "glyphicon glyphicon-exclamation-sign" }));
    $(cell).append(btn);

    return row;
}

// Function : new wiki click function
function click_new_wiki() {
    let text = $("#new-wiki-url");
    let url = confirm_decode($(text).val());
    let name;
    let pattern = new RegExp('((https:\\/\\/((.*\\/)+wiki\\/))([^#]+))(#.*)*');
    if (url.length === 0)
        return;
    if (pattern.exec(url) === null) {
        window.alert("不合法的網址！");
        $(text).val("");
        return;
    } else {
        name = pattern.exec(url)[5];
        url = pattern.exec(url)[2] + encodeURIComponent(name);
    }
    if (window.table_wiki_list.includes(url)) {
        window.alert("重複的網址！");
        $(text).val("");
        return;
    }
    window.corpus_tree.add_child(name, url);
    refresh_wiki_table();
    $(text).val("");
}

// Function : refresh wiki document table
function refresh_wiki_table() {
    let row_list = window.corpus_tree.toArray();
    let tbody = $("#wiki-table-body");
    window.table_wiki_list = row_list.map(function(val) {
        return val.url;
    });
    $(tbody).html("");
    for (let idx in row_list) {
        if (!row_list.hasOwnProperty(idx))
            continue;
        $(tbody).append(create_wiki_table_row(row_list[idx]));
    }
}

// Function : create new operate space for clicked corpus item
function load_corpus_content() {
    $("#corpus-operate-title").html("文獻集：" + window.corpus_target);
    $("#corpus-operate-url_input-container").show();
    $("#corpus-operate-wiki_table-container").show();

    // create corpus tree and load corpus content
    let wiki_list = window.handler.get_wiki_list(window.corpus_target);
    window.corpus_tree = new corpusTreeRoot(wiki_list);
    refresh_wiki_table();
}

// Function : wiki query progress callback function
function progress_callback(num) {
    $("#numerator").html(num.toString());
}

// Function : wiki query result callback function
function wiki_result_callback(result) {
    $.blockUI({
        message: "正在將維基頁面加入 docuXML ..."
    });
    for (let idx in result) {
        if (!result.hasOwnProperty(idx))
            continue;
        let pos = $("#" + hash(result[idx].url)).attr("pos");
        let node = window.corpus_tree.access_child_with_full_position(pos);
        if (result[idx].status) {
            node.set_state(0);
            result[idx].data.wiki_metadata.position = pos;
            window.handler.add_document({ name: window.corpus_target, document: result[idx].data });
        } else {
            node.set_state(4);
            node.set_message(result[idx].data);
        }
    }
    refresh_wiki_table();
    $.unblockUI();
}

// Event : sync with docuXML
$("#synchronize").click(function() {
    $("#synchronize").blur();
    if (window.corpus_target === null)
        return;
    $.blockUI({
        message: "已取得維基頁面&nbsp;...&nbsp;<span id='numerator'>0</span>&nbsp;/&nbsp;<span id='denominator'></span>"
    });
    window.corpus_tree.clean_tree();
    refresh_wiki_table();
    let urls = window.handler.check_necessary_url(window.corpus_target, window.table_wiki_list);
    if (urls.length !== 0) {
        $("#denominator").html(urls.length.toString());
        window.get_URL(urls, progress_callback, wiki_result_callback);
    } else {
        $.unblockUI();
    }
});

// Event : clear changes of the corpus
$("#clear_corpus_change").click(function() {
    $("#clear_corpus_change").blur();
    if (window.corpus_target === null)
        return;
    let content = "文獻集將回復至上一次更新後的狀態<br>在那之後所做的變更將不被保留<br>確認清除變更？<br>";
    check_sync(content, "確認", "取消", function(sync) {
        if (sync) {
            load_corpus_content();
        }
    });
});

// Event : back to main page
$("#home").click(function() {
    let content = "目前文獻集有條目尚未更新至 docuXML<br>若是回到主頁面則本工具將不會保留該條目<br>是否要回到主頁面？<br>";
    check_sync(content, "回到主頁面", "留在本工具", function(sync) {
        if (sync) {
            window.handler = null;
            window.load_main();
        }
    });
});

// Event : download docuXML
$("#download").click(function() {
    $("#download").blur();
    let content = "目前文獻集有條目尚未更新至 docuXML<br>本工具不保證下載結果如預期<br>是否要下載 docuXML？<br>";
    check_sync(content, "確認下載", "取消下載", function(sync) {
        if (sync) {
            let serializer = new XMLSerializer();
            let xml = serializer.serializeToString(window.handler.export_xml());
            xml = xml.replace(/\sxmlns="(.*?)"/g, '');
            let blob = new Blob([xml], {type: 'text/plain'});
            let link = document.getElementById("download-link");
            link.href = URL.createObjectURL(blob);
            link.download = window.filename;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    });
});

// Function : corpus item click function
function click_corpus_item(e) {
    let self = e.data.target;
    if ($(self).html() === window.corpus_target)
        return;
    let content = "目前文獻集有條目尚未更新至 docuXML<br>若是切換文獻集則本工具將不會保留該條目<br>是否要切換文獻集？<br>";
    check_sync(content, "確定切換", "取消切換", function(sync) {
        if (sync) {
            $(".corpus-item").removeClass("active");
            $(self).addClass("active");
            window.corpus_target = $(self).html();
            load_corpus_content();
        }
    });
}

// Function : create new corpus item in side navigation bar
function create_corpus_item(name) {
    let corpus_item = elementFactory({
        type: "div",
        class: "corpus-item select-disable",
        html: name,
        on: { click: click_corpus_item }
    });
    $("#corpus-list").append(corpus_item);
    if (window.corpus_list.length === 1) {
        $(corpus_item).click();
    }
}

// Event : create new corpus
$("#new-corpus").click(function() {
    let text = $("input:text[name=new-corpus-name]");
    let name = $(text).val();
    if (name === "")
        return;
    if (window.corpus_list.includes(name)) {
        window.alert("文獻集名稱不可重複！");
        $(text).val("");
        return;
    }
    window.handler.create_corpus(name);
    window.corpus_list = window.handler.get_corpus_list();
    create_corpus_item(name);
    $(text).val("");
});

$(document).ready(function() {
    window_variable_initial();
    $("#new-wiki").on("click", click_new_wiki);
    if (window.handler !== null) {
        window.corpus_list = window.handler.get_corpus_list();
        if (window.corpus_list.length !== 0) {
            for (let key in window.corpus_list) {
                if (!window.corpus_list.hasOwnProperty(key))
                    continue;
                create_corpus_item(window.corpus_list[key]);
            }
            $('#corpus-list div:nth-child(1)').click();
        }
    }
});
