function Gui(canvas, scene) {
    this.canvas = canvas;
    this.scene = scene;    
    this.widgets = [];
    this.iconCount = 0;
    this.createStaticIcons();
}

Gui.prototype.add = function(ent) {
    this.widgets.push(ent);
}

Gui.prototype.resize = function() {
    var w = this.canvas.width;
    var h = this.canvas.height;
    this.widgets.forEach(function(widget) {
        if(widget.onResize) widget.onResize(w,h);
    });
}
Gui.prototype.tick = function() {
    this.widgets.forEach(function(widget) { if(widget.tick) widget.tick(); });
}

Gui.prototype.enableGuiBehaviour = function(ent) {
    ent.mouseDown = false;
    
    var camera = this.scene.activeCamera;
    var canvas = this.canvas;
    
    ent.pointerEventObservable.add(function (d, s) {
        if(s.mask == BABYLON.PrimitivePointerInfo.PointerDown) {
            ent.mouseDown = true;
            ent.setPointerEventCapture(d.pointerId);
            setTimeout(function () {camera.detachControl(canvas);}, 0);
            var x = d.primitivePointerPos.x;
            var y = d.primitivePointerPos.y;            
            ent.offx = x - d.canvasPointerPos.x;
            ent.offy = y - d.canvasPointerPos.y;
            ent.lastx = x;
            ent.lasty = y;   
            ent.startx = x;
            ent.starty = y;
            if(ent.onButtonDown) ent.onButtonDown(ent,{x:x,y:y,e:d});            
        } else {
            var x = d.canvasPointerPos.x + ent.offx;
            var y = d.canvasPointerPos.y + ent.offy;             
            if(s.mask == BABYLON.PrimitivePointerInfo.PointerMove) {    
                var dx = x - ent.lastx; ent.lastx = x;
                var dy = y - ent.lasty; ent.lasty = y;
                if(ent.mouseDown && ent.onButtonDrag) {                    
                    ent.onButtonDrag(ent, {x:x,y:y,dx:dx,dy:dy,e:d});                    
                }
            } else if(s.mask == BABYLON.PrimitivePointerInfo.PointerUp) {            
                if(ent.onButtonUp) ent.onButtonUp(ent, {x:x, y:y, e:d});   
                if(ent.onClick && Math.pow(x-ent.startx,2)+Math.pow(y-ent.starty,2)<10) 
                    ent.onClick(ent, {x:x, y:y, e:d}); 
                ent.mouseDown = false;
                ent.releasePointerEventsCapture(d.pointerId);
                camera.attachControl(canvas, true);
            }
        }        
    }, BABYLON.PrimitivePointerInfo.PointerDown 
     | BABYLON.PrimitivePointerInfo.PointerUp
     | BABYLON.PrimitivePointerInfo.PointerMove);       
}

Gui.prototype.createStaticIcons = function() {
    new StaticIcon(this, mainFolder+"textures/scroll_to_zoom_icon.png", {resize: function(icon, w, h) { icon.x = w-62; icon.y = h - 70; }});    
    new StaticIcon(this, mainFolder+"textures/click_drag_icon.png", { resize: function(icon, w, h) { icon.x = w-62; icon.y = h - 140; }});
}

//=============================================================================

function StaticIcon(gui, url, conf) {
    BABYLON.ScreenSpaceCanvas2D.call(this, gui.scene, {
        id:"icon_" + (gui.iconCount++),
        size:new BABYLON.Size(64, 64),
        // backgroundFill: "#40408088",
    }); 
    gui.widgets.push(this);
    this.resize = conf.resize;
    var texture = new BABYLON.Texture(url, gui.scene, false);
    texture.hasAlpha = true;
    new BABYLON.Sprite2D(texture, { parent:this} );
}

StaticIcon.prototype = Object.create(BABYLON.ScreenSpaceCanvas2D.prototype); 
StaticIcon.prototype.constructor = StaticIcon;

StaticIcon.prototype.onResize = function(w,h) { if(this.resize) this.resize(this, w, h); }

//=============================================================================


function ControlSlider(gui, value, config) {

    const labels = window.labels || {closed:"Closed", open:"Open"};
    var x0 = 80, x1 = 260;
    BABYLON.ScreenSpaceCanvas2D.call(this, gui.scene, {
        id:"controlSlider",
        size:new BABYLON.Size(360, 30),
        // backgroundFill: "#40408088",
        children:[
            new BABYLON.Rectangle2D({
                id:"slideBar",
                fill:"#111111CC",
                x:x0,y:10,width:x1-x0+20,height:10,
                roundRadius:5,     
            }),
            new BABYLON.Text2D(labels.closed, { 
                fontName: "14pt Verdana", 
                x:10,y:1,
                defaultFontColor: new BABYLON.Color4(1,1,1,1), 
            }),
            new BABYLON.Text2D(labels.open, { 
                fontName: "14pt Verdana", 
                x:x1+30,y:1,
                defaultFontColor: new BABYLON.Color4(1,1,1,1), 
            })
        ]
    }); 
    slideCursor = this.cursor = new BABYLON.Rectangle2D({
            id:"slideCursor",
            parent:this,
            fill:"#00AAFFFF",
            border: BABYLON.Canvas2D.GetSolidColorBrush(new BABYLON.Color4(0,0,0,1)),
            borderThickness:2,
            x:0,y:5,width:20,height:20,
            roundRadius:10,            
        });
    slideCursor.targetx = 0;
    this.xmin = x0;
    this.xmax = x1;
    this.setValue(value);
    
    this.onValueChanged = config.callback;
    gui.enableGuiBehaviour(this);
    var me = this;
    this.onButtonDown = ControlSlider.onButtonDown;
    this.onButtonDrag = ControlSlider.onButtonDrag;
 
    gui.widgets.push(this);
    
    this.resize = config.resize || function(widget,w,h) { 
        widget.x = 10; /*(w-widget.width)/2;*/ 
        widget.y = 10; 
    };
}
    

ControlSlider.onButtonDown = function(c,e) {
    var off = 10;
    var d = c.cursor.x+off - e.x;
    if(Math.abs(d)>10) { c.cursorOffx = -off;  this.setCursorX(e.x+c.cursorOffx);}
    else { c.cursorOffx = c.cursor.x - e.x; } 
}
ControlSlider.onButtonDrag = function(c,e) {
    this.setCursorX(e.x + c.cursorOffx);
}

ControlSlider.prototype = Object.create(BABYLON.ScreenSpaceCanvas2D.prototype); 
ControlSlider.prototype.constructor = ControlSlider;

ControlSlider.prototype.onResize = function(w,h) { this.resize(this, w,h); }

ControlSlider.prototype.setCursorX = function(x) {
    if(x<this.xmin)x=this.xmin; else if(x>this.xmax) x=this.xmax;
    this.cursor.x = x;
    this.value = (x-this.xmin)/(this.xmax-this.xmin);
    this.onValueChanged(this.value);
}

ControlSlider.prototype.setValue = function(v) {
    if(v<0)v=0.0; else if(v>1.0)v=1.0;
    this.value = v;
    var x = this.xmin + (this.xmax-this.xmin) * this.value;
    this.cursor.x = this.cursor.targetx = x;
}

ControlSlider.prototype.tick = function() {
    if(Math.abs(this.cursor.x - this.cursor.targetx)>10) {
    
    }
}

//=============================================================================

function ToggleButton(gui, url, config) {
    BABYLON.ScreenSpaceCanvas2D.call(this, gui.scene, {
        id:"icon_" + (gui.iconCount++),
        size:new BABYLON.Size(64, 64),
        // backgroundFill: "#40408088",
    }); 
    gui.widgets.push(this);
    this.resize = config.resize;
    var texture = new BABYLON.Texture(url, gui.scene, false);
    texture.hasAlpha = true;
    this.sprite = new BABYLON.Sprite2D(texture, { parent:this, spriteSize:new BABYLON.Size(64,64), spriteFrame:0} );
    
    var callback = config.callback || function(tog, on) { console.log(on); };
    gui.enableGuiBehaviour(this);     
    var me = this;
    this.onClick = function() {
        me.sprite.spriteFrame = 1-me.sprite.spriteFrame;
        callback(me, me.sprite.spriteFrame);
    };
}

ToggleButton.prototype = Object.create(BABYLON.ScreenSpaceCanvas2D.prototype); 
ToggleButton.prototype.constructor = ToggleButton;

ToggleButton.prototype.onResize = function(w,h) { this.resize(this, w, h); }

