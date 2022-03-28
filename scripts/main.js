global.gsfbars = {};
const bt = global.gsfbars;
bt.bars = [];
bt.barid = 1;
var barrow = 0;
var cont, barcont, list, listupdate;
var bedit_name, bedit_max, bedit_val, bedit_pos, bedit_stepi, bedit_stepd;
var bedit_color, bedit_colorr, bedit_colorg, bedit_colorb;
var bdialog, bedit, editBar;

// Static bar dimensions
const BARSIZE_WIDTH = 250;
const BARSIZE_HEIGHT = 32;

const pu = () => Vars.player.unit();

// Bar Protocol
const createBar = (id) => new Bar(
	() => bt.get(id).name
		.replace(/@v/g, bt.get(id).v)
		.replace(/@mv/g, bt.get(id).mv),
	() => bt.get(id).color,
	() => bt.get(id).v/bt.get(id).mv
);

// Camera Cursor
var drawingCCursor = false;
function drawCameraCursor(){
	if(!drawingCCursor) return;
	let ccp = Core.camera.position;
	
	Lines.stroke(2);
	Draw.color(Color.rgb(220,65,65));
	Lines.line(ccp.x-32,ccp.y, ccp.x+32,ccp.y);
	Lines.line(ccp.x,ccp.y-32, ccp.x,ccp.y+32);
	Draw.reset();
}
Events.run(Trigger.draw, drawCameraCursor);

function ui_init(){
	// Bar Dialog
	bdialog = new BaseDialog("GSF Bars");
	bdialog.addCloseButton();
	var hlength = 0;
	bdialog.cont.pane(p=>{
		list = p;
	});
	bdialog.cont.row();
	bdialog.cont.button(
		"Create New Bar",
		() => bt.add("bar"+(bt.barid++), "Bar")
	).width(200);
	
	// Bar Editor Dialog
	bedit = new BaseDialog("GSF Bars - Edit");
	bedit.addCloseButton();
	bedit.cont.setTranslation(0, 175);
	editBar = function(id){
		let bar = bt.get(id);
		bedit_name = bar.name;
		bedit_color = bar.color;
		bedit_colorr = bar.color.r;
		bedit_colorg = bar.color.g;
		bedit_colorb = bar.color.b;
		bedit_pos = bar.pos;
		bedit_stepi = bar.svi;
		bedit_stepd = bar.svd;
		bedit_val = bar.v;
		bedit_max = bar.mv;
		
		let t = bedit.cont;
		t.clear();
		
		let barview = new Bar(
			() => bedit_name
				.replace(/@v/g, bedit_val)
				.replace(/@mv/g, bedit_max),
			() => bedit_color,
			() => bedit_val/bedit_max
		);
		t.add(barview).width(BARSIZE_WIDTH).height(BARSIZE_HEIGHT);
		
		t.row();
		t.table(cons(st => {
			st.defaults().pad(6);
			
			st.label(() => "Name: ");
			let namef = st.field(bedit_name, input => {
				bedit_name = input;
			}).get();
			if(Vars.mobile) st.button("Input", () => {
				Vars.ui.showTextInput("","",500, bedit_name, input => {
					bedit_name = input;
					namef.text = input;
				});
			}).width(100);
			
			st.row();
			st.label(() => "Color: ");
			st.table(cons(cui => {
				cui.label(() => "R ");
				cui.slider(0, 1, .1, bedit_colorr, input => {
					bedit_colorr = input;
					bedit_color = Color.rgb(
						bedit_colorr*255,
						bedit_colorg*255,
						bedit_colorb*255
					);
				});
				
				cui.row();
				cui.label(() => "G ");
				cui.slider(0, 1, .1, bedit_colorg, input => {
					bedit_colorg = input;
					bedit_color = Color.rgb(
						bedit_colorr*255,
						bedit_colorg*255,
						bedit_colorb*255
					);
				});
				
				cui.row();
				cui.label(() => "B ");
				cui.slider(0, 1, .1, bedit_colorb, input => {
					bedit_colorb = input;
					bedit_color = Color.rgb(
						bedit_colorr*255,
						bedit_colorg*255,
						bedit_colorb*255
					);
				});
			}));
			
			if(bar.popped){
				st.row();
				st.label(() => "Position: ");
				st.table(cons(pui => {
					pui.label(() => "X ");
					let fieldX = pui.field(bedit_pos.x, input => {
						parseFloat(bedit_pos.set(input, bedit_pos.y));
					}).get();
					
					pui.row();
					pui.label(() => "Y ");
					let fieldY = pui.field(bedit_pos.y, input => {
						parseFloat(bedit_pos.set(bedit_pos.x, input));
					}).get();
					
					pui.row();
					pui.label(() => "XY ");
					pui.button("Set", () => {
						bedit.hide();
						bdialog.hide();
						cont.visible = false;
						drawingCCursor = true;
						let tempPTable = Core.scene.table();
						tempPTable.setTranslation(0, -(Core.scene.height*.3));
						let ccp = Core.camera.position;
						tempPTable.button("Set", () => {
							try{
								bedit_pos.set(Math.floor(ccp.x/8),Math.floor(ccp.y/8));
								fieldX.text = bedit_pos.x;
								fieldY.text = bedit_pos.y;
								tempPTable.clear();
								tempPTable.visible = false;
								drawingCCursor = false;
								cont.visible = true;
								bdialog.show();
								bedit.show();
							}catch(e){
								// Notify the player that the mod is having a stroke
								Vars.ui.showErrorMessage(e);
								tempPTable.clear();
								tempPTable.visible = false;
								drawingCCursor = false;
								cont.visible = true;
							}
						}).width(125).height(60);
						tempPTable.row();
						tempPTable.label(() => Math.floor(ccp.x/8)+", "+Math.floor(ccp.y/8))
					}).width(100);
				}));
			}
			
			st.row();
			st.label(() => "Maximum Value: ");
			st.field(""+bedit_max, input => {
				bedit_max = parseFloat(input);
			}).get().validator = text => !isNaN(parseFloat(text));
			
			st.row();
			st.label(() => "Current Value: ");
			st.field(""+bedit_val, input => {
				bedit_val = parseFloat(input);
			}).get().validator = text => !isNaN(parseFloat(text));
			
			st.row();
			st.label(() => "Incremental Step: ");
			st.field(""+bedit_stepi, input => {
				bedit_stepi = parseFloat(input);
			}).get().validator = text => !isNaN(parseFloat(text));
			
			st.row();
			st.label(() => "Decremental Step: ");
			st.field(""+bedit_stepd, input => {
				bedit_stepd = parseFloat(input);
			}).get().validator = text => !isNaN(parseFloat(text));
		}));
		
		t.row();
		t.table(cons(bui => {
			bui.defaults().width(150).pad(4);
			
			bui.button("[green]Save Bar", () => {
				bedit.hide();
				
				bar.name = bedit_name;
				bar.color = bedit_color;
				bar.mv = bedit_max;
				bar.v = bedit_val;
				bar.svi = bedit_stepi;
				bar.svd = bedit_stepd;
			});
			bui.button("[red]Delete Bar", () => {
				bedit.hide();
				bar.remove();
			});
			if(!bar.popped) let pob = bui.button("Popout", () => {
				Vars.ui.showConfirm("Popout bar?", "You will gain new settings for it, but you cannot revert this action and must recreate it to go back into Listed form.", () => {
					bedit.hide();
					bar.popout();
				});
			});
		}));
		
		bedit.show();
	}
}

var initialized = false;

// Initializatiokttntnt
// TODO: get grammer pills
function init(){
	if(initialized) return;
	
	cont = Core.scene.table().top().left();
	cont.setTranslation(6, -(Core.scene.height*.13));
	
	let btns = new Table(cons(bui => {
		bui.button("Open Bar Menu", () => bdialog.show())
			.width(245);
		bui.button("H", () => bt.t())
			.width(50).padLeft(5);
	}));
	cont.add(btns);
	cont.row();
	barcont = cont.table().get();
	
	bt.add = function(id,display,max,color){
		if(bt.bars[id] != undefined){
			Log.err('Identification: "'+id+'" is already in use.');
			return null;
		}
		
		let ev = (value,def) => value != undefined ? value : def;
		let barframeroot = new Table();
		let barframe = new Table();
		barframe = barframeroot.add(barframe);
		
		bt.bars[id] = {
			// Configuration
			name: ev(display, id),
			v: 0,
			mv: ev(max, 1),
			svi: .1,
			svd: .1,
			color: ev(color, Color.rgb(
				.9*255,
				.3*255,
				.3*255
			)),
			pos: new Vec2(0,0),
			popped: false,
			
			// Functions
			remove(){
				let br = bt.get(id);
				br.container.clear();
				br.frame.clear();
				if(br.popcont != null){
					br.popcont.clear();
					br.popcont.visible = false;
				}
				delete bt.bars[id];
			},
			popout(){
				let binst = bt.get(id);
				if(binst.popped) return;
				
				binst.container.clear();
				binst.popcont = Core.scene.table();
				let binp = binst.popcont;
				let barRend = createBar(id);
				assemble(binp, barRend, 1);
				
				let popfunc = () => {
					try{
						if(binst == null) return;
						
						let cc = Core.camera, ccp = cc.position, cs = Core.scene;
						let daxis = (dimensionType) =>
							cs[dimensionType]/cc[dimensionType];
						let taxis = (axis) =>
							(binst.pos[axis]*8 - ccp[axis]) * dim[axis];
							
						let dim = Vec2(daxis("width"), daxis("height"));
						binst.popcont.setTranslation(taxis("x"), taxis("y"));
					}catch(e){}
				}
				Events.on(Trigger, popfunc);
				binst.popped = true;
			},
			
			// UI
			popcont: null,
			container: new Table(),
			frame: barframeroot,
			bar: createBar(id)
		};
		
		let bard = bt.get(id);
		
		let bcontainer = bard.container;
		
		function assemble(tabl, barElement, barw){
			tabl.button("<", ()=>{
				bard.v -= bard.svd;
				if(bard.v < 0) bard.v = 0;
			}).width(50).height(BARSIZE_HEIGHT+18).pad(2);
			tabl.add(barElement)
				.width(BARSIZE_WIDTH*barw).height(BARSIZE_HEIGHT).pad(4);
			tabl.button(">", ()=>{
				bard.v += bard.svi;
				if(bard.v > bard.mv) bard.v = bard.mv;
			}).width(50).height(BARSIZE_HEIGHT+18).pad(2);
		}
		assemble(bcontainer, bard.bar, 1);
		barcont.add(bcontainer);
		barcont.row();
		
		barframe.pad(5);
		barframe.get().background(Tex.button);
		let bar = createBar(id);
		assemble(barframe.get(), bar, 1.5);
		barframe.get().button("Edit", () => editBar(id)).width(70).pad(6);
		list.add(barframeroot);
		
		if(++barrow % 1 == 0) list.row();
		
		return bt.bars[id];
	}
	bt.get = (id) => bt.bars[id];
	bt.clear = () => {for(bi in bt.bars) bt.get(bi).remove()};
	bt.listAll = function(){
		let m = "Bar IDs:\n";
		for(bi in bt.bars) m += bi+"\n";
		Log.info(m);
	}
	
	bt.hide = function(){barcont.visible = false}
	bt.show = function(){barcont.visible = true}
	bt.toggle = function(){
		barcont.visible = !barcont.visible;
	}
	bt.t = bt.toggle;
	
	ui_init();
	
	initialized = true;
}


Events.on(WorldLoadEvent, init);