'use strict';
//=====================================
// Model
//=====================================
// ------------------------------
// Tabler
// ------------------------------
var Tabler = {
    // fields
    list: [],

    // methods
    create: function() {
        this.clear();

        for (var i = 0; i < 2; i++) {
            this.list[i] = {id: "id_" + i, name: "テーブル" + i};
        }

        return true;
    },

    clear: function() {
        this.list = [];
    }
};

// ------------------------------
// SlickGrider
// ------------------------------
var SlickGrider = {
    // fields
    columns: [],
    options: {},
    dataView: [],
    grid: [],
    data: [],

    // methods
    set: function(tableId, tableContainer) {
        this.clear();

        // テーブル指定があるか
        if (tableId.length != 0) {
            // （ダミー）カラム情報設定
            this.columns = [
                {id: "sel", name: "#", field: "num", behavior: "select", cssClass: "cell-selection", width: 40, cannotTriggerInsert: true, resizable: false, selectable: false },
                {id: "title", name: "タイトル", field: "title", width: 120, minWidth: 120, cssClass: "cell-title", editor: Slick.Editors.Text, validator: validateRequiredField, sortable: true},
                {id: "duration", name: "期間", field: "duration", editor: Slick.Editors.Text, sortable: true},
                {id: "%", defaultSortAsc: false, name: "% 進捗率", field: "percentComplete", width: 80, resizable: false, formatter: Slick.Formatters.PercentCompleteBar, editor: Slick.Editors.PercentComplete, sortable: true},
                {id: "start", name: "開始日", field: "start", minWidth: 60, editor: Slick.Editors.Date, sortable: true},
                {id: "finish", name: "終了日", field: "finish", minWidth: 60, editor: Slick.Editors.Date, sortable: true},
                {id: "effort-driven", name: "実施中", width: 80, minWidth: 20, maxWidth: 80, cssClass: "cell-effort-driven", field: "effortDriven", formatter: Slick.Formatters.Checkmark, editor: Slick.Editors.Checkbox, cannotTriggerInsert: true, sortable: true}
            ];

            // （ダミー）テーブルデータ設定
            for (var i = 0; i < 100; i++) {
                var d = (this.data[i] = {});

                d["id"] = "id_" + i;
                d["num"] = i;
                d["title"] = "Task " + i;
                d["duration"] = "5 days";
                d["percentComplete"] = Math.round(Math.random() * 100);
                d["start"] = "01/01/2009";
                d["finish"] = "01/05/2009";
                d["effortDriven"] = (i % 5 == 0);
            }

            this.options = {
              editable: true,               // 編集：可
              enableAddRow: true,           // 行追加：可
              enableCellNavigation: true,   // セルナビゲーション？：可
              asyncEditorLoading: true,     // 非同期ローディング：可
              forceFitColumns: false,       // 強制カラム巾：不可
              topPanelHeight: 25            // トップパネルの高さ：25px
            };

            // SlickGridインスタンス化
            this.dataView = new Slick.Data.DataView({ inlineFilters: true });
            this.grid = new Slick.Grid(tableContainer, this.dataView, this.columns, this.options);

            return true;

        } else {

            return false;

        }
    },

    clear: function() {
        this.columns = [];
        this.dataView = [];
        this.grid = [];
        this.data = [];
    }
};

var sortcol = "title";
var sortdir = 1;
var percentCompleteThreshold = 0;
var searchString = "";


//=====================================
// View
//=====================================
$(function () {

    // ------------------------------
    // テーブル選択ドロップダウン
    // ------------------------------
    Tabler.create();

    var li = [];
    for (var i = Tabler.list.length; i > 0; i--) {
        li.push("<li role='presentation'><a href='javascript:void(0);' role='menuitem' tabindex='-1' onclick='SlickGrider.set(&quot;#&quot;, &quot;#gridContainer&quot;); viewTable(SlickGrider); return false;'>追加</a></li>");
    }
    $(".dropdown-menu").prepend(li.join(""));

    // ------------------------------
    // テーブル表示
    // ------------------------------
    if (true == SlickGrider.set("", "#gridContainer")) {
        viewTable(SlickGrider)
    }

    $(".grid-header .ui-icon")
    .addClass("ui-state-default ui-corner-all")
    .mouseover(function (e) {
      $(e.target).addClass("ui-state-hover")
    })
    .mouseout(function (e) {
      $(e.target).removeClass("ui-state-hover")
    });

    $(".grid-header .ui-icon .ui-icon-search")
        .on("click", ".click", toggleFilterRow());
});

function viewTable(slickGrider) {
    // レイアウト
    var columnPicker = new Slick.Controls.ColumnPicker(slickGrider.columns, slickGrider.grid);  // カラムピッカー設定
    var pager = new Slick.Controls.Pager(slickGrider.dataView, slickGrider.grid, $("#pager"));  // ページャー設定
    $("#inlineFilterPanel").appendTo(slickGrider.grid.getTopPanel()).show();                    // フィルタパネル追加

    // ------------------------------
    // グリッドのMethod追加
    // ------------------------------
    slickGrider.grid.setSelectionModel(new Slick.RowSelectionModel());

    slickGrider.grid.onCellChange.subscribe(function (e, args) {
        slickGrider.dataView.updateItem(args.item.id, args.item);
    });

    slickGrider.grid.onAddNewRow.subscribe(function (e, args) {
        var item = {"num": slickGrider.data.length, "id": "new_" + (Math.round(Math.random() * 10000)), "title": "New task", "duration": "1 day", "percentComplete": 0, "start": "01/01/2009", "finish": "01/01/2009", "effortDriven": false};
        $.extend(item, args.item);
        slickGrider.dataView.addItem(item);
    });

    slickGrider.grid.onKeyDown.subscribe(function (e) {
        // select all rows on ctrl-a
        if (e.which != 65 || !e.ctrlKey) {
          return false;
        }

        var rows = [];
        for (var i = 0; i < slickGrider.dataView.getLength(); i++) {
          rows.push(i);
        }

        slickGrider.grid.setSelectedRows(rows);
        e.preventDefault();
    });

    slickGrider.grid.onSort.subscribe(function (e, args) {
        sortdir = args.sortAsc ? 1 : -1;
        sortcol = args.sortCol.field;

        if ($.browser.msie && $.browser.version <= 8) {
            // using temporary Object.prototype.toString override
            // more limited and does lexicographic sort only by default, but can be much faster

            var percentCompleteValueFn = function () {
                var val = this["percentComplete"];
                if (val < 10) {
                    return "00" + val;
                } else if (val < 100) {
                    return "0" + val;
                } else {
                    return val;
                }
            };

            // use numeric sort of % and lexicographic for everything else
            slickGrider.dataView.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortAsc);
        } else {
            // using native sort with compare
            // preferred method but can be very slow in IE with huge datasets
            slickGrider.dataView.sort(compare, args.sortAsc);
        }
    });

    // wire up model events to drive the grid
    slickGrider.dataView.onRowCountChanged.subscribe(function (e, args) {
        slickGrider.grid.updateRowCount();
        slickGrider.grid.render();
    });

    slickGrider.dataView.onRowsChanged.subscribe(function (e, args) {
        slickGrider.grid.invalidateRows(args.rows);
        slickGrider.grid.render();
    });

    slickGrider.dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
        var isLastPage = pagingInfo.pageNum == pagingInfo.totalPages - 1;
        var enableAddRow = isLastPage || pagingInfo.pageSize == 0;
    });


    var h_runfilters = null;

    // wire up the slider to apply the filter to the model
    $("#pcSlider,#pcSlider2").slider({
        "range": "min",
        "slide": function (event, ui) {
            Slick.GlobalEditorLock.cancelCurrentEdit();

            if (percentCompleteThreshold != ui.value) {
                window.clearTimeout(h_runfilters);
                h_runfilters = window.setTimeout(updateFilter, 10);
                percentCompleteThreshold = ui.value;
            }
        }
    });

    // wire up the search textbox to apply the filter to the model
    $("#txtSearch,#txtSearch2").keyup(function (e) {
        Slick.GlobalEditorLock.cancelCurrentEdit();

        // clear on Esc
        if (e.which == 27) {
            this.value = "";
        }

        searchString = this.value;
        updateFilter();
    });

    function updateFilter() {
        slickGrider.dataView.setFilterArgs({
            percentCompleteThreshold: percentCompleteThreshold,
            searchString: searchString
        });
        slickGrider.dataView.refresh();
    }

    $("#btnSelectRows").click(function () {
        if (!Slick.GlobalEditorLock.commitCurrentEdit()) {
            return;
        }

        var rows = [];
        for (var i = 0; i < 10 && i < slickGrider.dataView.getLength(); i++) {
            rows.push(i);
        }

        slickGrider.grid.setSelectedRows(rows);
    });


    // initialize the model after all the events have been hooked up
    slickGrider.dataView.beginUpdate();
    slickGrider.dataView.setItems(slickGrider.data);
    slickGrider.dataView.setFilterArgs({
        percentCompleteThreshold: percentCompleteThreshold,
        searchString: searchString
    });
    slickGrider.dataView.setFilter(judgeConditionMatch);
    slickGrider.dataView.endUpdate();

    // if you don't want the items that are not visible (due to being filtered out
    // or being on a different page) to stay selected, pass 'false' to the second arg
    slickGrider.dataView.syncGridSelection(slickGrider.grid, true);

    $("#gridContainer").resizable();

    return true;
}

//=====================================
// Controller
//=====================================
// 必須チェック
function validateRequiredField(value) {
    if (value == null || value == undefined || !value.length) {
        return {valid: false, msg: "This is a required field"};
    } else {
        return {valid: true, msg: null};
    }
}

// フィルター条件判定
function judgeConditionMatch(item, args) {
    // 閾値以上か
    if (item["percentComplete"] < args.percentCompleteThreshold) {
        return false;
    }

    // 検索文字列が"title"に含まれるか
    if (args.searchString != "" && item["title"].indexOf(args.searchString) == -1) {
        return false;
    }

    return true;
}

// 2つの値の比較
function compare(a, b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
}

// フィルター行表示
function toggleFilterRow() {
    //slickGrider.grid.setTopPanelVisibility(!SlickGrider.grid.getOptions().showTopPanel);
}

function percentCompleteSort(a, b) {
    return a["percentComplete"] - b["percentComplete"];
}
