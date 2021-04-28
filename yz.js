// ==UserScript==
// @name        实践征文网验证码测试版本2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://www.iwriting123.com/details/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant        unsafeWindow

// ==/UserScript==

(function() {
    'use strict';
    // GM_deleteValue(124)
    var startX;
    var startY;
    var endX=0;
    var endY=0;
    var offsetX=0;
    var offsetY=0;
    var oldx;
    var oldy;
    var newx;
    var newy;
    var movex;
    var movey;
    var oldtime;
    var newtime;
    var X,Y;
    var isAutoPointer=true;
    var oldXHR = unsafeWindow.XMLHttpRequest;
    var myDB;
    var request;
    var db;
    var isOpen;
    var isSuccess=false;    //滑动轨迹是否能用
    var head=document.getElementsByTagName('head')[0];
    var traceResult={
        isSuccess :false
    }

    unsafeWindow.XMLHttpRequest = newXHR;
    var oldcreateElement = document.createElement;

    function aaaa(e){
        console.log(e)
        console.log(e.target.innerHTML)
    }

    function NEWcreateElement(oldElement) {
        var newElement = oldcreateElement.call(document, oldElement);
        unsafeWindow['oldcreateElement']=oldcreateElement
        //   window['oldcreateElement']=oldcreateElement
        if(oldElement=="script")
        {
            console.log('%O',newElement)
            //   console.log(newElement.src)
            var oldaddEventListener = newElement.addEventListener;
            var NEWaddEventListener=(function(old){
                return function(a,b,c){
                    //   old.call(this,a,b,c);
                    old(a,b,c)
                    console.log(b)
                    console.log(this)
                }

            })(oldaddEventListener)
            //  newElement.addEventListener=NEWaddEventListener;   //改写addEventListener函数
            }
        return newElement;
    }
    var oldheadappendChild= head.appendChild;

    function NEWappendchild(nodes){

        if(nodes.tagName=="SCRIPT")
        {
            console.log('%O',nodes)
            const url=new URL(nodes.src);
            if(url.host=="api.geetest.com"&&url.pathname=="/ajax.php"){
                let params = url.searchParams;
                let call_back=params.get("callback")
                let newfunctionName="geetest_"+new Date().getTime();
                var dsa= document.createElement("script");
                dsa.type = "text/javascript";
                var functionString="function "+newfunctionName+"(e){"+
                    call_back+"(e);"+"judgeResult(e) ; "
                +"}"
                dsa.appendChild( document.createTextNode(functionString))
                oldheadappendChild.call(head,dsa)
                params.set("callback",newfunctionName);
                console.log("原函数名："+call_back)
                console.log("新函数名称:"+newfunctionName)
                console.log(url.search)
                nodes.src =url.href
            }
        }
        oldheadappendChild.call(head,nodes)
    }
    unsafeWindow["judgeResult"]=judgeResult;
    function judgeResult(data){
        console.log(data);
        if(data.message=="success"||data.success=="1"){
            console.log("轨迹成功")
            if(!isAutoPointer){  //如果是手动的
                //并且成功了 则记录这条轨迹
                let distance=trace_XY.upX-trace_XY.downX;   //最后再判断一下轨迹实际移动距离和 测出来的距离之差大于10，则修正trace_XY.distance的值
                if(Math.abs(trace_XY.distance-distance)>10){
                    trace_XY.distance=distance;
                    trace_XY.successNum++;
                    console.log("该记录存在误差，已经修正")
                }
                console.log("轨迹通过验证");
                // DBrequest.addData(trace_XY)  //存入indexDD
                let trace_XY_String=  JSON.stringify(trace_XY);
                console.log(trace_XY_String);
                GM_setValue(trace_XY.distance, trace_XY_String)   //存入storage
                console.log("轨迹已存入脚本GM中")
            }
        }
        if(data.message=="fail"||data.success=="0"){
            console.log("轨迹失败")
            if(isAutoPointer){  //自动生成的轨迹，但是没有通过
                //应该删除对应的轨迹
                //  setTimeout(function(){
                //      GM_deleteValue(trace_XY.distance)
                //      console.log(trace_XY.distance+"距离生成的轨迹失败，已删除")
                //  },1000)
            }

        }

    }

    head.appendChild=NEWappendchild;

    function ShowTheObject(obj){
        var des = "";
        for(var name in obj){
            des += name + ":" + obj[name] + ";";
        }
        return des;
    }

    document.createElement = NEWcreateElement;
    var trace_XY={
        distance:0,
        downX:0,
        downY: 0,
        upX:0,
        upY:0,
        startTime:0,
        endTime:0,
        totalTime:0,
        tracenum:0,
        successNum:0,
        errorNum:0,
        x:new Array(),
        y:new Array(),
        delaytime:new Array()
    }

    var DBrequest={
        openDB:function(){
            request = window.indexedDB.open("轨迹测试版",1);  //返回 IDBRequest 对象
            request.onerror = function (event) {
                console.log('数据库打开报错');
            };
            request.onsuccess = function (event) {
                db = event.target.result;
                console.log('数据库打开成功');
                isOpen=true;
            };
            request.onupgradeneeded = function (event) {
                isOpen = true;
                db = event.target.result;
                let objectStore;
                if (!db.objectStoreNames.contains('trace_XY')) {
                    objectStore = db.createObjectStore('trace_XY', { keyPath: 'distance' });
                    objectStore.createIndex('distance', 'distance', { unique: false });
                }
                console.log('数据库更新');
            }
        },
        addData:function(obj){
            let transaction= db.transaction("trace_XY",'readwrite');
            let store=transaction.objectStore("trace_XY")
            let result = store.add(obj)
            result.onerror = function(){
                console.error('数据库中已有该数据')
            };
            result.onsuccess = function(){
                console.log('数据已存入数据库')
            };
        },
        closeDB:function(){
            db.close();
            console.log('数据库已关闭')
        },
        getDataByKey:function(key,func){
            //根据存储空间的键找到对应数据
            let transaction=db.transaction("trace_XY",'readwrite');
            let store=transaction.objectStore("trace_XY")
            let result = store.get(key);
            result.onerror = function(){
                console.error('getDataByKey error');
                func("error")
            };
            result.onsuccess = function(e){
                var result_data = e.target.result;
                console.log('查找数据成功')
                console.log(result_data);
                func(result_data);
            };
        }

    }

    // DBrequest.openDB();

    var trace_XYs=new Array();
    for(let i=0;i<260;i++){
        let s =JSON.parse(GM_getValue(i,"{}"));

        trace_XYs[i] =s
    }
    console.log(trace_XYs)
    //调用函数把轨迹数据下载到磁盘
    //  downloadFile("轨迹文件.txt",[JSON.stringify(trace_XYs)]);

    createUpDiv(function(e){
        var file = this.files[0];
        if (!!file) {
            var reader=new FileReader();
            reader.readAsText(file,"gb2312");
            reader.onload=function(){
                let result=JSON.parse(reader.result);
                console.log(result)
                for(let i=0;i<260;i++){
                    if(result[i]!=undefined){
                        GM_setValue(result[i].distance,JSON.stringify(result[i]) )
                    }
                }
            }
        }
    })

    function ajaxEventTrigger(event) {

        var ajaxEvent = new CustomEvent(event, { detail: this });
        unsafeWindow.dispatchEvent(ajaxEvent);
    }

    //hook xhr
    function newXHR() {
        var realXHR = new oldXHR();
        // traceResult.isSuccess=true;
        console.log("ajax对象被创建")
        realXHR.addEventListener('readystatechange', function() { ajaxEventTrigger.call(this, 'ajaxReadyStateChange'); }, false);

        return realXHR;
    }

    window.addEventListener('ajaxReadyStateChange123', function (e) {
        let xhr=e.detail;
        if(xhr.readyState==4&&xhr.status==200){
            console.log(xhr); // XMLHttpRequest Object
            if(xhr.responseURL.search("http://www.iwriting123.com/users/likeContentbygeecode")!=-1){   //是发送给极简验证码的
                let result=JSON.parse(xhr.response);
                let isPass=result.message=="对同一篇文章，每个用户每个自然日仅能点赞一次。"||result.message=="点赞成功";
                if(isAutoPointer){   //如果是自动的
                    if(!isPass){   //自动生成的轨迹，但是没有通过
                        //应该删除对应的轨迹
                        //  setTimeout(function(){
                        //      GM_deleteValue(trace_XY.distance)
                        //      console.log(trace_XY.distance+"距离生成的轨迹失败，已删除")
                        //  },1000)

                    }
                }else{  //如果是手动的
                    if(isPass){  //并且成功了 则记录这条轨迹
                        let distance=trace_XY.upX-trace_XY.downX;   //最后再判断一下轨迹实际移动距离和 测出来的距离之差大于10，则修正trace_XY.distance的值
                        if(Math.abs(trace_XY.distance-distance)>10){
                            trace_XY.distance=distance;
                            trace_XY.successNum++;
                            console.log("该记录存在误差，已经修正")
                        }
                        console.log("轨迹通过验证");
                        // DBrequest.addData(trace_XY)  //存入indexDD
                        let trace_XY_String=  JSON.stringify(trace_XY);
                        console.log(trace_XY_String);
                        GM_setValue(trace_XY.distance, trace_XY_String)   //存入storage
                        console.log("轨迹已存入脚本GM中")
                    }
                }

            }
        }
    });
    var observerOptions = {
        childList: true, // 观察目标子节点的变化，添加或者删除
        attributes: true, // 观察属性变动
        subtree: true // 默认为 false，设置为 true 可以观察后代节点
    }

    console.log("脚本初始化完成，等待操作")
    var canvasdiv;    //验证码区域的最顶层div
    var btn1=document.getElementById("like");
    btn1.addEventListener("click",function(){
        canvasdiv=document.querySelector("div.geetest_panel_next");
        var observer = new MutationObserver(callback);  // 对滑动验证码的创建进行监听
             observer.observe(canvasdiv, observerOptions);
    },{
        capture: false,
        passive: true,
        once: false
    })

    function callback(mutationList, observer) {
        mutationList.forEach((mutation) => {
            switch(mutation.type) {
                case 'childList':
                    /* 从树上添加或移除一个或更多的子节点； */
                    this.disconnect();
                    var tmid = window.setTimeout(function(){

                        let can1= document.querySelector("canvas.geetest_canvas_fullbg.geetest_fade.geetest_absolute"); //没缺口的图片
                        let can2= document.querySelector("canvas.geetest_canvas_bg.geetest_absolute");    //有缺口图片
                        let can3= document.querySelector("canvas.geetest_canvas_slice.geetest_absolute"); //滑块

                        let ctx1=can1.getContext("2d");
                        let ctx2=can2.getContext("2d");
                        let ctx3=can3.getContext("2d");


                        let imgData=ctx1.getImageData(0,0,260,160);//没有缺口的图片
                        let imgData2=ctx2.getImageData(0,0,260,160);//有缺口的图片
                        let imgData3=ctx3.getImageData(0,0,260,160); //滑动图标


                        //灰度化
                        huiduanderzhi(imgData,200)
                        huiduanderzhi(imgData2,200)
                        huiduanderzhi(imgData3,200)


                        let int8Array1=imgData.data;
                        let int8Array2=imgData2.data;
                        let int8Array3=imgData3.data;
                        let lengths=imgData.data.length;

                        let x=0;
                        let y=0;
                        let xRarray=new Array(); //滑块的左轮廓
                        let xLarray=new Array(); //滑块的右轮廓
                        let yArray=new Array(); //滑块的对应y坐标
                        erzhihua(int8Array3,100)

                        //计算轮廓
                        for(var i=0,xianzhi=0,j=0,index=0;i<lengths;i+=4)
                        {
                            if(int8Array3[i]==0){
                                index=parseInt(i/4);
                                y=   parseInt(index/260)
                                yArray[j]=parseInt(index/260);
                                x=index%260

                                xRarray[j]=x;
                                xianzhi=(y+1)*1040
                                for(;i<xianzhi;i+=4){
                                    if(int8Array3[i]!=0&&int8Array3[i-4]==0){
                                        index=parseInt(i/4);
                                        x=index%260;
                                        xLarray[j]=x-1;
                                    }
                                }
                                j++;
                            }
                        }

                        for(let i=0,j=0,num=0,k=0,index=0;i<lengths;i+=4,num=0){
                            k=int8Array1[i]-int8Array2[i];
                            k=Math.abs(k)
                            if(k>10){
                                index = parseInt(i/4);
                                y =  parseInt(index/260)
                                x=index%260
                                drawquekou(int8Array3,int8Array2[i],i)
                                if(int8Array2[i]==0){
                                    console.log("("+x+","+y+")"+" : "+k)
                                }
                            }
                        }

                        let XLarray2=   getoffsetXArray(int8Array3,xLarray,yArray[0]);  //缺口的左轮廓X坐标
                        let offsetX1=  averageX(xRarray);
                        let offsetX2=  averageX(XLarray2);
                        offsetX=offsetX2-offsetX1;
                        console.log("偏移距离为 "+offsetX)
                        trace_XY.distance=offsetX;

                        let div2=document.querySelector("div.geetest_slider_button");
                        RecordTrace();
                        clickSwipe2(offsetX,div2)
                    }, 500);
                    break;

            }
        });
    }


    //下载文件的函数
    function downloadFile(fileName, content,) {
        var aLink = document.createElement('a');
        var blob = new Blob(content);
        aLink.download = fileName;
        aLink.href = URL.createObjectURL(blob);
        console.log(aLink.href)
        aLink.click();
    }

    //创建上传div
    function createUpDiv(callfunction){
        var parentdiv = document.createElement("div");
        var childdiv = document.createElement("div");
        var childinput = document.createElement("input");
        childinput.addEventListener("change",callfunction)
        childinput.type = "file"
        childdiv.innerHTML = "上"
        parentdiv.style = "position: fixed;right: 10px;bottom: 10px"
        childdiv.style = "width: 40px;height: 40px;background: #2178fc;color: #fff;text-align: center; line-height: 40px;"
        childinput.style = "width: 40px; height: 40px;position: absolute;  left: 0px; top: 0px; z-index:1; opacity: 0;  cursor: pointer;"
        parentdiv.appendChild(childdiv)
        parentdiv.appendChild(childinput)
        document.body.appendChild(parentdiv)
    }


    function RecordTrace(){
        let huadong=document.querySelector("div.geetest_holder.geetest_mobile.geetest_ant.geetest_embed");
        let div2=document.querySelector("div.geetest_slider_button");

        var ok=false;
        huadong.addEventListener("pointermove",function(e){
            if(ok){
                newtime=new Date().getTime();
                trace_XY.delaytime[trace_XY.tracenum]=newtime-oldtime;
                oldtime=newtime;
                trace_XY.x[trace_XY.tracenum]=e.clientX;
                trace_XY.y[trace_XY.tracenum++]=e.clientY;
            }

        })

        div2.addEventListener("pointerdown",function(e){
            init();
            trace_XY.distance=offsetX;
            ok=true;
            trace_XY.startTime=new Date().getTime();
            oldtime= trace_XY.startTime;
            newtime= trace_XY.startTime;
            trace_XY.downX=e.clientX;
            trace_XY.downY=e.clientY;
            trace_XY.delaytime[trace_XY.tracenum]=0;
            trace_XY.x[trace_XY.tracenum]=e.clientX;
            trace_XY.y[trace_XY.tracenum++]=e.clientY;
        })
        div2.addEventListener("pointerup",function(e){
            //  judge_DeleteOrSaveTrace();
            trace_XY.endTime=new Date().getTime();
            newtime= trace_XY.endTime
            trace_XY.delaytime[trace_XY.tracenum]=newtime-oldtime;
            oldtime=newtime;
            ok=false;
            trace_XY.upX=e.clientX;
            trace_XY.upY=e.clientY;
            trace_XY.x[trace_XY.tracenum]=e.clientX;
            trace_XY.y[trace_XY.tracenum++]=e.clientY;
            trace_XY.totalTime=trace_XY.endTime-trace_XY.startTime;
            console.log(trace_XY)
        })
    }


    function init(){
        trace_XY={
            distance:0,
            downX:0,
            downY: 0,
            upX:0,
            upY:0,
            startTime:0,
            endTime:0,
            totalTime:0,
            tracenum:0,
            x:new Array(),
            y:new Array(),
            delaytime:new Array()
        }
    }
    function set_startX_startY(){
        let targetObj=document.querySelector("div.geetest_slider_button")
        let resultRect = calcViewportLocation(targetObj, window);
        console.log(resultRect)
        startX=resultRect.x+resultRect.w-(Math.random()*20+20)
        startY=resultRect.y+resultRect.h-(Math.random()*20+20)
    }

    //找出现最多的那个值
    function averageX(arrays){
        let Maxnum=new Array(260),max=0,maxindex=0;
        let lengths=arrays.length;
        for(let i=0;i<260;i++){
            Maxnum[i]=0;
        }

        for(let i=0;i<lengths;i++){
            Maxnum[arrays[i]]++;
        }

        for(let i=0;i<260;i++)
        {
            if(Maxnum[i]>max){
                max=Maxnum[i];
                maxindex=i;
            }
        }
        return maxindex;
    }

    //计算偏移数组
    function getoffsetXArray(arrays,Xarray,h){
        let lengths=arrays.length;
        let  XLarray2=new Array(Xarray.length);
        let x=0,y=0;
        for(let i=(h++)*1040+ Xarray[0]*4+4,j=0,index=0;j<Xarray.length||i<lengths;i+=4)
        {
            if(arrays[i]==0){
                index=parseInt(i/4);
                x=index%260
                XLarray2[j]=x;
                j++;
                i=(h++)*1040+ Xarray[j]*4;
            }
        }
        return XLarray2;
    }


    function drawquekou(int8Array,k,i){

        k=k<140?0:255;
        int8Array[i]=k;
        int8Array[i+1]=k;
        int8Array[i+2]=k;
        int8Array[i+3]=255;
    }

    //灰度化
    function huiduanderzhi(imgData,Threshold){
        let int8Array =imgData.data
        //图像灰度化 0.3R+0.59G+0.11B
        let lengths=int8Array.length;
        for(let i=0,k=0;i<lengths;i++){
            k=0.3*int8Array[i]+0.59*int8Array[i+1]+0.11*int8Array[i+2];
            k=parseInt(k);

            int8Array[i++]=k;
            int8Array[i++]=k;
            int8Array[i++]=k;
        }
        return int8Array;
    }


    //将滑块二值化
    function erzhihua(int8Array,Threshold){
        // console.log(int8Array)
        let lengths=int8Array.length;
        for(let i=0,k=0;i<lengths;i+=4){
            k=int8Array[i];
            if(int8Array[i+3]==255&&k!=0){
                k=0;   //黑色
            }else{
                k=255;  //白色
                int8Array[i+3]=255
            }

            int8Array[i]=k;
            int8Array[i+1]=k;
            int8Array[i+2]=k;
        }
    }


    //获取元素相对屏幕的坐标
    function calcViewportLocation(obj, winObj) {
        var currentWindow = winObj;
        var rect = obj.getBoundingClientRect(); //获取该元素在当前窗口视图区域的位置
        var top = rect.top;
        var left = rect.left;
        var width = rect.width;
        var height = rect.height;

        //若该元素在某iframe中，则计算该frame相较于父窗口的位置，并向上迭代直到主frame。元素的位置坐标需要累加iframe的偏移。
        while (currentWindow.frameElement != null) {
            var obj1 = currentWindow.frameElement;
            currentWindow = currentWindow.parent;
            rect = obj1.getBoundingClientRect();
            if (rect.top > 0) { top += rect.top; }
            if (rect.left > 0) { left += rect.left; }
        }
        var final_x = Math.round(left);
        var final_y = Math.round(top);
        return {y:final_y, x:final_x, w:width, h:height};
    }

    function creatpointerdown(x, y, offsetX, offsetY) {
        let downEvent = new PointerEvent("pointerdown", {
            pointerId: 1,
            bubbles: true, //如果事件是冒泡类型，则返回 true，否则返回 fasle。
            button: 0, // 按下 0(通常是左按钮)  移动时为-1
            buttons: 1, // pointerdown 1(通常是左键)   pointerup时候为 0(没有键被按下)
            cancelable: true, //如果用 preventDefault() 方法可以取消与事件关联的默认动作，则为 true，否则为 fasle。
            composed: true, //用来指示该事件是否可以从 Shadow DOM 传递到一般的 DOM。
            pointerType: "mouse",
            which: 1, //按下和抬起为1  移动时为0
            width: 1, //触摸的物体，与屏幕接触的面积
            height: 1, //触摸的物体，与屏幕接触的面积
            isPrimary: true, //是否为主指针
            isTrusted: true, //是否可信任  判断是脚本操作还是真人操作 ，其实并不能设置，脚本操作则为false
            tiltX: 0, //Y和Z轴的角度 -90到90度
            tiltY: 0,
            view: document.defaultView, //与事件关联的窗口
            clientX: x,
            clientY: y,
            screenX: x, //鼠标在屏幕上的x坐标
            screenY: y + 71, //鼠标在屏幕上的y坐标
            movementX: 0,
            movementY: 0,
            pressure: 0.5 //压力  鼠标点击时为 0.5  鼠标按下为抬起移动时为0  抬起了移动时为0
        });
        return downEvent;
    }


    //按下时移动
    function creatpointermove(x, y, offsetX, offsetY) {

        let moveEvent = new PointerEvent("pointermove", {
            pointerId: 1,
            bubbles: true, //如果事件是冒泡类型，则返回 true，否则返回 fasle。
            button: -1, // 按下 0(通常是左按钮)  移动时为-1
            buttons: 1, // pointerdown 1(通常是左键)   pointerup时候为 0(没有键被按下)
            cancelable: true, //如果用 preventDefault() 方法可以取消与事件关联的默认动作，则为 true，否则为 fasle。
            composed: true, //用来指示该事件是否可以从 Shadow DOM 传递到一般的 DOM。
            pointerType: "mouse",
            which: 0, //按下和抬起为1  移动时为0
            width: 1, //触摸的物体，与屏幕接触的面积
            height: 1, //触摸的物体，与屏幕接触的面积
            isPrimary: true,
            tiltX: 0,
            tiltY: 0,
            view: document.defaultView, //与事件关联的窗口
            clientX: x,
            clientY: y,
            screenX: x, //鼠标在屏幕上的x坐标
            screenY: y + 71, //鼠标在屏幕上的y坐标
            movementX: offsetX,
            movementY: offsetY,
            pressure: 0.5 //压力  鼠标点击时为 0.5  鼠标按下为抬起移动时为0  抬起了移动时为0  抬起时为0
        });

        return moveEvent;
    }



    function creatpointerup(x, y, offsetX, offsetY) {

        let upEvent = new PointerEvent("pointerup", {
            pointerId: 1,
            bubbles: true, //如果事件是冒泡类型，则返回 true，否则返回 fasle。
            button: -1, // 按下 0(通常是左按钮)  移动时为-1
            buttons: 0, // pointerdown 1(通常是左键)   pointerup时候为 0(没有键被按下)
            cancelable: true, //如果用 preventDefault() 方法可以取消与事件关联的默认动作，则为 true，否则为 fasle。
            composed: true, //用来指示该事件是否可以从 Shadow DOM 传递到一般的 DOM。
            pointerType: "mouse",
            which: 1, //按下和抬起为1  移动时为0
            width: 1, //触摸的物体，与屏幕接触的面积
            height: 1, //触摸的物体，与屏幕接触的面积
            isPrimary: true,
            tiltX: 0,
            tiltY: 0,
            view: document.defaultView, //与事件关联的窗口
            clientX: x,
            clientY: y,
            screenX: x, //鼠标在屏幕上的x坐标
            screenY: y + 71, //鼠标在屏幕上的y坐标
            movementX: offsetX,
            movementY: offsetY,
            pressure: 0 //压力  鼠标点击时为 0.5  鼠标按下为抬起移动时为0  抬起了移动时为0  抬起时为0
        });

        return upEvent;
    }
    function clickSwipe2(distance,target){
        //    let traceXY = trace_XYs[distance];
        //        DBrequest.getData(distance,null);  //从idnexDB中取数据

        let traceXY =JSON.parse(GM_getValue(distance,"{}"));
        let tracks = {
            xArray: new Array(),
            yArray: new Array(),
            delaytime:new Array()
        }

        if(traceXY.distance!=undefined){  //找到完全匹配的距离
            console.log("找到匹配距离")
            getStraightTracks(traceXY,tracks)
        } else{
            for(let i=1;i<10&&(distance+i)<260;i++){    //没找到完全匹配的距离，找一个相近的
                //    traceXY =JSON.parse(GM_getValue(distance+i,"{}"));
                //    if(traceXY.distance!=undefined){
                //       console.log("找到近似距离")
                //        getVagueStraightTracks(traceXY,tracks,i)
                //        break;
                //    }
            }
        }

        if(traceXY.distance==undefined){
            console.log("没有匹配到可用轨迹")
            isAutoPointer=false;
            return ;
        }
        isAutoPointer=true;
        traceResult.isSuccess=false;   //先假设这次生成的轨迹失败了 ， 如果网页调用了xhr则自动修改该值为真
        //轨迹已经生成， 可以开始移动了
        console.log("轨迹已经生成， 开始移动了")
        let local=0;
        let lengths=traceXY.tracenum;
        let down = creatpointerdown(tracks.xArray[local], tracks.yArray[local++], 0, 0); //按
        target.dispatchEvent(down)

        setTimeout(function timeoutFun(){
            if(local>=lengths){
                return;
            }
            if (local < lengths-1) {
                target.dispatchEvent(new creatpointermove(tracks.xArray[local], tracks.yArray[local], tracks.xArray[local]-tracks.xArray[local-1], tracks.yArray[local]-tracks.yArray[local-1]))
            }else{
                target.dispatchEvent(new creatpointerup(tracks.xArray[local], tracks.yArray[local], 0, 0))
            }
            local++;
            setTimeout(timeoutFun,tracks.delaytime[local]);
        },tracks.delaytime[local])
    }


    // 模拟轨迹 从按下到位移再到最后抬起   //保存的轨迹， 坐标X和Y的偏移量， tracks保存生成的新轨迹
    function getStraightTracks(traceXY,tracks) {
        set_startX_startY(); //设置startX和startY
        let Xcha=traceXY.downX-startX;
        let Ycha=traceXY.downY-startY;
        let lengths = traceXY.tracenum;
        for(let i=0;i<lengths;i++){
            tracks.xArray[i]=traceXY.x[i]-Xcha
            tracks.yArray[i]=traceXY.y[i]-Ycha
            tracks.delaytime[i]=traceXY.delaytime[i];
        }
    }

    //找不到完全匹配的轨迹，则找短10距离内的  cha就是两个距离的差值
    function getVagueStraightTracks(traceXY,tracks,cha) {
        set_startX_startY(); //设置startX和startY
        let Xcha=traceXY.downX-startX;
        let Ycha=traceXY.downY-startY;
        let lengths = traceXY.tracenum;
        for(let i=0;i<lengths;i++){
            tracks.xArray[i]=traceXY.x[i]-Xcha
            tracks.yArray[i]=traceXY.y[i]-Ycha
            tracks.delaytime[i]=traceXY.delaytime[i];
        }
        for(let i=1,lx=1;i<lengths;i++){
            if(i<cha){
                traceXY.x[i]=traceXY.x[i]+(lx++);
            }else{
                traceXY.x[i]+=cha;
            }
        }
    }

    function judge_DeleteOrSaveTrace(){
        //应该删除对应的轨迹
        setTimeout((function(traceResult){
            return  function(){
                console.log(traceResult.isSuccess)
                if(!traceResult.isSuccess){
                    //  GM_deleteValue(trace_XY.distance)
                    trace_XY.errorNum++;
                    let trace_XY_String=  JSON.stringify(trace_XY);
                    //  console.log(trace_XY_String);
                    GM_setValue(trace_XY.distance, trace_XY_String)   //存入storage
                    console.log(trace_XY.distance+"距离生成的轨迹失败，失败次数:"+trace_XY.errorNum)
                }
            }
        })(traceResult),1500)
    }

})();