'usestrict';
console.clear();
constIS_MOBILE=window.innerWidth<=640;
constIS_DESKTOP=window.innerWidth>800;
constIS_HEADER=IS_DESKTOP&&window.innerHeight<300;
constIS_HIGH_END_DEVICE=(()=>{
	consthwConcurrency=navigator.hardwareConcurrency;
	if(!hwConcurrency){
		returnfalse;
	}
	constminCount=window.innerWidth<=1024?4:8;
	returnhwConcurrency>=minCount;
})();
constMAX_WIDTH=7680;
constMAX_HEIGHT=4320;
constGRAVITY=0.9;
letsimSpeed=1;
functiongetDefaultScaleFactor(){
	if(IS_MOBILE)return 0.9;
	if(IS_HEADER)return 0.75;
	return1;
}
letstageW,stageH;
letquality=1;
letisLowQuality=false;
letisNormalQuality=true;
letisHighQuality=false;
constQUALITY_LOW=1;
constQUALITY_NORMAL=2;
constQUALITY_HIGH=3;
constSKY_LIGHT_NONE=0;
constSKY_LIGHT_DIM=1;
constSKY_LIGHT_NORMAL=2;
constCOLOR={
	Red:'#ff0043',
	Green:'#14fc56',
	Blue:'#1e7fff',
	Purple:'#e60aff',
	Gold:'#ffbf36',
	White:'#ffffff'
};
constINVISIBLE='_INVISIBLE_';

constPI_2=Math.PI*2;
constPI_HALF=Math.PI*0.5;
consttrailsStage=newStage('trails-canvas');
constmainStage=newStage('main-canvas');
conststages=[
	trailsStage,
	mainStage
];
functionfullscreenEnabled(){
	returnfscreen.fullscreenEnabled;
}
functionisFullscreen(){
	return!!fscreen.fullscreenElement;
}
functiontoggleFullscreen(){
	if(fullscreenEnabled()){
		if(isFullscreen()){
			fscreen.exitFullscreen();
		}else{
			fscreen.requestFullscreen(document.documentElement);
		}
	}
}
fscreen.addEventListener('fullscreenchange',()=>{
	store.setState({fullscreen:isFullscreen()});
});
conststore={
	_listeners:newSet(),
	_dispatch(prevState){
		this._listeners.forEach(listener=>listener(this.state,prevState))
	},
	
	state:{
		paused:true,
		soundEnabled:false,
		menuOpen:false,
		openHelpTopic:null,
		fullscreen:isFullscreen(),
		config:{
			quality:String(IS_HIGH_END_DEVICE?QUALITY_HIGH:QUALITY_NORMAL),
			shell:'Random',
			size:IS_DESKTOP
				?'3'
				:IS_HEADER
					?'1.2'
					:'2',
			autoLaunch:true,
			finale:false,
			skyLighting:SKY_LIGHT_NORMAL+'',
			hideControls:IS_HEADER,
			longExposure:false,
			scaleFactor:getDefaultScaleFactor()
		}
	},
	setState(nextState){
		constprevState=this.state;
		this.state=Object.assign({},this.state,nextState);
		this._dispatch(prevState);
		this.persist();
	},
	subscribe(listener){
		this._listeners.add(listener);
		return()=>this._listeners.remove(listener);
	},
	
	load(){
		constserializedData=localStorage.getItem('cm_fireworks_data');
		if(serializedData){
			const{
				schemaVersion,
				data
			}=JSON.parse(serializedData);
			
			constconfig=this.state.config;
			switch(schemaVersion){
				case'1.1':
					config.quality=data.quality;
					config.size=data.size;
					config.skyLighting=data.skyLighting;
					break;
				case'1.2':
					config.quality=data.quality;
					config.size=data.size;
					config.skyLighting=data.skyLighting;
					config.scaleFactor=data.scaleFactor;
					break;
				default:
					thrownewError('versionswitchshouldbeexhaustive');
			}
			console.log(`Loadedconfig(schemaversion${schemaVersion})`);
		}
		elseif(localStorage.getItem('schemaVersion')==='1'){
			letsize;
			try{
				constsizeRaw=localStorage.getItem('configSize');
				size=typeofsizeRaw==='string'&&JSON.parse(sizeRaw);
			}
			catch(e){
				console.log('Recoveredfromerrorparsingsavedconfig:');
				console.error(e);
				return;
			}
			constsizeInt=parseInt(size,10);
			if(sizeInt>=0&&sizeInt<=4){
				this.state.config.size=String(sizeInt);
			}
		}
	},
	persist(){
		constconfig=this.state.config;
		localStorage.setItem('cm_fireworks_data',JSON.stringify({
			schemaVersion:'1.2',
			data:{
				quality:config.quality,
				size:config.size,
				skyLighting:config.skyLighting,
				scaleFactor:config.scaleFactor
			}
		}));
	}
};
if(!IS_HEADER){
	store.load();
}
functiontogglePause(toggle){
	constpaused=store.state.paused;
	letnewValue;
	if(typeoftoggle==='boolean'){
		newValue=toggle;
	}else{
		newValue=!paused;
	}

	if(paused!==newValue){
		store.setState({paused:newValue});
	}
}

functiontoggleSound(toggle){
	if(typeoftoggle==='boolean'){
		store.setState({soundEnabled:toggle});
	}else{
		store.setState({soundEnabled:!store.state.soundEnabled});
	}
}

functiontoggleMenu(toggle){
	if(typeoftoggle==='boolean'){
		store.setState({menuOpen:toggle});
	}else{
		store.setState({menuOpen:!store.state.menuOpen});
	}
}

functionupdateConfig(nextConfig){
	nextConfig=nextConfig||getConfigFromDOM();
	store.setState({
		config:Object.assign({},store.state.config,nextConfig)
	});
	
	configDidUpdate();
}
functionconfigDidUpdate(){
	constconfig=store.state.config;
	
	quality=qualitySelector();
	isLowQuality=quality===QUALITY_LOW;
	isNormalQuality=quality===QUALITY_NORMAL;
	isHighQuality=quality===QUALITY_HIGH;
	
	if(skyLightingSelector()===SKY_LIGHT_NONE){
		appNodes.canvasContainer.style.backgroundColor='#000';
	}
	
	Spark.drawWidth=quality===QUALITY_HIGH?0.75:1;
}
constisRunning=(state=store.state)=>!state.paused&&!state.menuOpen;
constsoundEnabledSelector=(state=store.state)=>state.soundEnabled;
constcanPlaySoundSelector=(state=store.state)=>isRunning(state)&&soundEnabledSelector(state);
constqualitySelector=()=>+store.state.config.quality;
constshellNameSelector=()=>store.state.config.shell;
constshellSizeSelector=()=>+store.state.config.size;
constfinaleSelector=()=>store.state.config.finale;
constskyLightingSelector=()=>+store.state.config.skyLighting;
constscaleFactorSelector=()=>store.state.config.scaleFactor;



//HelpContent
consthelpContent={
	shellType:{
		header:'ShellType',
		body:'Thetypeoffireworkthatwillbelaunched.Select"Random"foraniceassortment!'
	},
	shellSize:{
		header:'ShellSize',
		body:'Thesizeofthefireworks.Modeledafterrealfireworkshellsizes,largershellshavebiggerburstswithmorestars,andsometimesmorecomplexeffects.However,largershellsalsorequiremoreprocessingpowerandmaycauselag.'
	},
	quality:{
		header:'Quality',
		body:'Overallgraphicsquality.Iftheanimationisnotrunningsmoothly,tryloweringthequality.Highqualitygreatlyincreasestheamountofsparksrenderedandmaycauselag.'
	},
	skyLighting:{
		header:'SkyLighting',
		body:'Illuminatesthebackgroundasfireworksexplode.Ifthebackgroundlookstoobrightonyourscreen,trysettingitto"Dim"or"None".'
	},
	scaleFactor:{
		header:'Scale',
		body:'Allowsscalingthesizeofallfireworks,essentiallymovingyoucloserorfartheraway.Forlargershellsizes,itcanbeconvenienttodecreasethescaleabit,especiallyonphonesortablets.'
	},
	autoLaunch:{
		header:'AutoFire',
		body:'Launchessequencesoffireworksautomatically.Sitbackandenjoytheshow,ordisabletohavefullcontrol.'
	},
	finaleMode:{
		header:'FinaleMode',
		body:'Launchesintenseburstsoffireworks.Maycauselag.Requires"AutoFire"tobeenabled.'
	},
	hideControls:{
		header:'HideControls',
		body:'Hidesthetranslucentcontrolsalongthetopofthescreen.Usefulforscreenshots,orjustamoreseamlessexperience.Whilehidden,youcanstilltapthetop-rightcornertore-openthismenu.'
	},
	fullscreen:{
		header:'Fullscreen',
		body:'Togglesfullscreenmode.'
	},
	longExposure:{
		header:'OpenShutter',
		body:'Experimentaleffectthatpreserveslongstreaksoflight,similartoleavingacamerashutteropen.'
	}
};

constnodeKeyToHelpKey={
	shellTypeLabel:'shellType',
	shellSizeLabel:'shellSize',
	qualityLabel:'quality',
	skyLightingLabel:'skyLighting',
	scaleFactorLabel:'scaleFactor',
	autoLaunchLabel:'autoLaunch',
	finaleModeLabel:'finaleMode',
	hideControlsLabel:'hideControls',
	fullscreenLabel:'fullscreen',
	longExposureLabel:'longExposure'
};


//RenderappUI/keepinsyncwithstate
constappNodes={
	stageContainer:'.stage-container',
	canvasContainer:'.canvas-container',
	controls:'.controls',
	menu:'.menu',
	menuInnerWrap:'.menu__inner-wrap',
	pauseBtn:'.pause-btn',
	pauseBtnSVG:'.pause-btnuse',
	soundBtn:'.sound-btn',
	soundBtnSVG:'.sound-btnuse',
	shellType:'.shell-type',
	shellTypeLabel:'.shell-type-label',
	shellSize:'.shell-size',
	shellSizeLabel:'.shell-size-label',
	quality:'.quality-ui',
	qualityLabel:'.quality-ui-label',
	skyLighting:'.sky-lighting',
	skyLightingLabel:'.sky-lighting-label',
	scaleFactor:'.scaleFactor',
	scaleFactorLabel:'.scaleFactor-label',
	autoLaunch:'.auto-launch',
	autoLaunchLabel:'.auto-launch-label',
	finaleModeFormOption:'.form-option--finale-mode',
	finaleMode:'.finale-mode',
	finaleModeLabel:'.finale-mode-label',
	hideControls:'.hide-controls',
	hideControlsLabel:'.hide-controls-label',
	fullscreenFormOption:'.form-option--fullscreen',
	fullscreen:'.fullscreen',
	fullscreenLabel:'.fullscreen-label',
	longExposure:'.long-exposure',
	longExposureLabel:'.long-exposure-label',
	
	//HelpUI
	helpModal:'.help-modal',
	helpModalOverlay:'.help-modal__overlay',
	helpModalHeader:'.help-modal__header',
	helpModalBody:'.help-modal__body',
	helpModalCloseBtn:'.help-modal__close-btn'
};

//ConvertappNodesselectorstodomnodes
Object.keys(appNodes).forEach(key=>{
	appNodes[key]=document.querySelector(appNodes[key]);
});

//Removefullscreencontrolifnotsupported.
if(!fullscreenEnabled()){
	appNodes.fullscreenFormOption.classList.add('remove');
}

//Firstrenderiscalledininit()
functionrenderApp(state){
	constpauseBtnIcon=`#icon-${state.paused?'play':'pause'}`;
	constsoundBtnIcon=`#icon-sound-${soundEnabledSelector()?'on':'off'}`;
	appNodes.pauseBtnSVG.setAttribute('href',pauseBtnIcon);
	appNodes.pauseBtnSVG.setAttribute('xlink:href',pauseBtnIcon);
	appNodes.soundBtnSVG.setAttribute('href',soundBtnIcon);
	appNodes.soundBtnSVG.setAttribute('xlink:href',soundBtnIcon);
	appNodes.controls.classList.toggle('hide',state.menuOpen||state.config.hideControls);
	appNodes.canvasContainer.classList.toggle('blur',state.menuOpen);
	appNodes.menu.classList.toggle('hide',!state.menuOpen);
	appNodes.finaleModeFormOption.style.opacity=state.config.autoLaunch?1:0.32;
	
	appNodes.quality.value=state.config.quality;
	appNodes.shellType.value=state.config.shell;
	appNodes.shellSize.value=state.config.size;
	appNodes.autoLaunch.checked=state.config.autoLaunch;
	appNodes.finaleMode.checked=state.config.finale;
	appNodes.skyLighting.value=state.config.skyLighting;
	appNodes.hideControls.checked=state.config.hideControls;
	appNodes.fullscreen.checked=state.fullscreen;
	appNodes.longExposure.checked=state.config.longExposure;
	appNodes.scaleFactor.value=state.config.scaleFactor.toFixed(2);
	
	appNodes.menuInnerWrap.style.opacity=state.openHelpTopic?0.12:1;
	appNodes.helpModal.classList.toggle('active',!!state.openHelpTopic);
	if(state.openHelpTopic){
		const{header,body}=helpContent[state.openHelpTopic];
		appNodes.helpModalHeader.textContent=header;
		appNodes.helpModalBody.textContent=body;
	}
}

store.subscribe(renderApp);

//Performsideeffectsonstatechanges
functionhandleStateChange(state,prevState){
	constcanPlaySound=canPlaySoundSelector(state);
	constcanPlaySoundPrev=canPlaySoundSelector(prevState);
	
	if(canPlaySound!==canPlaySoundPrev){
		if(canPlaySound){
			soundManager.resumeAll();
		}else{
			soundManager.pauseAll();
		}
	}
}

store.subscribe(handleStateChange);


functiongetConfigFromDOM(){
	return{
		quality:appNodes.quality.value,
		shell:appNodes.shellType.value,
		size:appNodes.shellSize.value,
		autoLaunch:appNodes.autoLaunch.checked,
		finale:appNodes.finaleMode.checked,
		skyLighting:appNodes.skyLighting.value,
		longExposure:appNodes.longExposure.checked,
		hideControls:appNodes.hideControls.checked,
		//Storevalueasnumber.
		scaleFactor:parseFloat(appNodes.scaleFactor.value)
	};
};

constupdateConfigNoEvent=()=>updateConfig();
appNodes.quality.addEventListener('input',updateConfigNoEvent);
appNodes.shellType.addEventListener('input',updateConfigNoEvent);
appNodes.shellSize.addEventListener('input',updateConfigNoEvent);
appNodes.autoLaunch.addEventListener('click',()=>setTimeout(updateConfig,0));
appNodes.finaleMode.addEventListener('click',()=>setTimeout(updateConfig,0));
appNodes.skyLighting.addEventListener('input',updateConfigNoEvent);
appNodes.longExposure.addEventListener('click',()=>setTimeout(updateConfig,0));
appNodes.hideControls.addEventListener('click',()=>setTimeout(updateConfig,0));
appNodes.fullscreen.addEventListener('click',()=>setTimeout(toggleFullscreen,0));
//ChangingscaleFactorrequirestriggeringresizehandlingcodeaswell.
appNodes.scaleFactor.addEventListener('input',()=>{
	updateConfig();
	handleResize();
});

Object.keys(nodeKeyToHelpKey).forEach(nodeKey=>{
	consthelpKey=nodeKeyToHelpKey[nodeKey];
	appNodes[nodeKey].addEventListener('click',()=>{
		store.setState({openHelpTopic:helpKey});
	});
});

appNodes.helpModalCloseBtn.addEventListener('click',()=>{
	store.setState({openHelpTopic:null});
});

appNodes.helpModalOverlay.addEventListener('click',()=>{
	store.setState({openHelpTopic:null});
});



//Constantderivations
constCOLOR_NAMES=Object.keys(COLOR);
constCOLOR_CODES=COLOR_NAMES.map(colorName=>COLOR[colorName]);
//Invisiblestarsneedanindentifier,eventhroughtheywon'tberendered-physicsstillapply.
constCOLOR_CODES_W_INVIS=[...COLOR_CODES,INVISIBLE];
//Mapofcolorcodestotheirindexinthearray.Usefulforquicklydeterminingifacolorhasalreadybeenupdatedinaloop.
constCOLOR_CODE_INDEXES=COLOR_CODES_W_INVIS.reduce((obj,code,i)=>{
	obj[code]=i;
	returnobj;
},{});
//Tuplesisamapkeysbycolorcodes(hex)withvaluesof{r,g,b}tuples(stilljustobjects).
constCOLOR_TUPLES={};
COLOR_CODES.forEach(hex=>{
	COLOR_TUPLES[hex]={
		r:parseInt(hex.substr(1,2),16),
		g:parseInt(hex.substr(3,2),16),
		b:parseInt(hex.substr(5,2),16),
	};
});

//Getarandomcolor.
functionrandomColorSimple(){
	returnCOLOR_CODES[Math.random()*COLOR_CODES.length|0];
}

//Getarandomcolor,withsomecustomizationoptionsavailable.
letlastColor;
functionrandomColor(options){
	constnotSame=options&&options.notSame;
	constnotColor=options&&options.notColor;
	constlimitWhite=options&&options.limitWhite;
	letcolor=randomColorSimple();
	
	//limittheamountofwhitechosenrandomly
	if(limitWhite&&color===COLOR.White&&Math.random()<0.6){
		color=randomColorSimple();
	}
	
	if(notSame){
		while(color===lastColor){
			color=randomColorSimple();
		}
	}
	elseif(notColor){
		while(color===notColor){
			color=randomColorSimple();
		}
	}
	
	lastColor=color;
	returncolor;
}

functionwhiteOrGold(){
	returnMath.random()<0.5?COLOR.Gold:COLOR.White;
}


//Shellhelpers
functionmakePistilColor(shellColor){
	return(shellColor===COLOR.White||shellColor===COLOR.Gold)?randomColor({notColor:shellColor}):whiteOrGold();
}

//Uniqueshelltypes
constcrysanthemumShell=(size=1)=>{
	constglitter=Math.random()<0.25;
	constsingleColor=Math.random()<0.72;
	constcolor=singleColor?randomColor({limitWhite:true}):[randomColor(),randomColor({notSame:true})];
	constpistil=singleColor&&Math.random()<0.42;
	constpistilColor=pistil&&makePistilColor(color);
	constsecondColor=singleColor&&(Math.random()<0.2||color===COLOR.White)?pistilColor||randomColor({notColor:color,limitWhite:true}):null;
	conststreamers=!pistil&&color!==COLOR.White&&Math.random()<0.42;
	letstarDensity=glitter?1.1:1.25;
	if(isLowQuality)starDensity*=0.8;
	if(isHighQuality)starDensity=1.2;
	return{
		shellSize:size,
		spreadSize:300+size*100,
		starLife:900+size*200,
		starDensity,
		color,
		secondColor,
		glitter:glitter?'light':'',
		glitterColor:whiteOrGold(),
		pistil,
		pistilColor,
		streamers
	};
};


constghostShell=(size=1)=>{
	//Extendcrysanthemumshell
	constshell=crysanthemumShell(size);
	//Ghosteffectcanbefast,soextendstarlife
	shell.starLife*=1.5;
	//Ensurewealwayshaveasinglecolorotherthanwhite
	letghostColor=randomColor({notColor:COLOR.White});
	//Alwaysusestreamers,andsometimesapistil
	shell.streamers=true;
	constpistil=Math.random()<0.42;
	constpistilColor=pistil&&makePistilColor(ghostColor);
	//Ghosteffect-transitionfrominvisibletochosencolor
	shell.color=INVISIBLE;
	shell.secondColor=ghostColor;
	//Wedon'twantglittertobespewedbyinvisiblestars,andwedon'tcurrently
	//haveawaytotransitionglitterstate.Sowe'lldisableit.
	shell.glitter='';
	
	returnshell;
};


conststrobeShell=(size=1)=>{
	constcolor=randomColor({limitWhite:true});
	return{
		shellSize:size,
		spreadSize:280+size*92,
		starLife:1100+size*200,
		starLifeVariation:0.40,
		starDensity:1.1,
		color,
		glitter:'light',
		glitterColor:COLOR.White,
		strobe:true,
		strobeColor:Math.random()<0.5?COLOR.White:null,
		pistil:Math.random()<0.5,
		pistilColor:makePistilColor(color)
	};
};


constpalmShell=(size=1)=>{
	constcolor=randomColor();
	constthick=Math.random()<0.5;
	return{
		shellSize:size,
		color,
		spreadSize:250+size*75,
		starDensity:thick?0.15:0.4,
		starLife:1800+size*200,
		glitter:thick?'thick':'heavy'
	};
};

constringShell=(size=1)=>{
	constcolor=randomColor();
	constpistil=Math.random()<0.75;
	return{
		shellSize:size,
		ring:true,
		color,
		spreadSize:300+size*100,
		starLife:900+size*200,
		starCount:2.2*PI_2*(size+1),
		pistil,
		pistilColor:makePistilColor(color),
		glitter:!pistil?'light':'',
		glitterColor:color===COLOR.Gold?COLOR.Gold:COLOR.White,
		streamers:Math.random()<0.3
	};
	//returnObject.assign({},defaultShell,config);
};

constcrossetteShell=(size=1)=>{
	constcolor=randomColor({limitWhite:true});
	return{
		shellSize:size,
		spreadSize:300+size*100,
		starLife:750+size*160,
		starLifeVariation:0.4,
		starDensity:0.85,
		color,
		crossette:true,
		pistil:Math.random()<0.5,
		pistilColor:makePistilColor(color)
	};
};

constfloralShell=(size=1)=>({
	shellSize:size,
	spreadSize:300+size*120,
	starDensity:0.12,
	starLife:500+size*50,
	starLifeVariation:0.5,
	color:Math.random()<0.65?'random':(Math.random()<0.15?randomColor():[randomColor(),randomColor({notSame:true})]),
	floral:true
});

constfallingLeavesShell=(size=1)=>({
	shellSize:size,
	color:INVISIBLE,
	spreadSize:300+size*120,
	starDensity:0.12,
	starLife:500+size*50,
	starLifeVariation:0.5,
	glitter:'medium',
	glitterColor:COLOR.Gold,
	fallingLeaves:true
});

constwillowShell=(size=1)=>({
	shellSize:size,
	spreadSize:300+size*100,
	starDensity:0.6,
	starLife:3000+size*300,
	glitter:'willow',
	glitterColor:COLOR.Gold,
	color:INVISIBLE
});

constcrackleShell=(size=1)=>{
	//favorgold
	constcolor=Math.random()<0.75?COLOR.Gold:randomColor();
	return{
		shellSize:size,
		spreadSize:380+size*75,
		starDensity:isLowQuality?0.65:1,
		starLife:600+size*100,
		starLifeVariation:0.32,
		glitter:'light',
		glitterColor:COLOR.Gold,
		color,
		crackle:true,
		pistil:Math.random()<0.65,
		pistilColor:makePistilColor(color)
	};
};

consthorsetailShell=(size=1)=>{
	constcolor=randomColor();
	return{
		shellSize:size,
		horsetail:true,
		color,
		spreadSize:250+size*38,
		starDensity:0.9,
		starLife:2500+size*300,
		glitter:'medium',
		glitterColor:Math.random()<0.5?whiteOrGold():color,
		//Addstrobeeffecttowhitehorsetails,tomakethemmoreinteresting
		strobe:color===COLOR.White
	};
};

functionrandomShellName(){
	returnMath.random()<0.5?'Crysanthemum':shellNames[(Math.random()*(shellNames.length-1)+1)|0];
}

functionrandomShell(size){
	//Specialselectionforcodepenheader.
	if(IS_HEADER)returnrandomFastShell()(size);
	//Normaloperation
	returnshellTypes[randomShellName()](size);
}

functionshellFromConfig(size){
	returnshellTypes[shellNameSelector()](size);
}

//Getarandomshell,notincludingprocessingintensivevarients
//Notethisisonlyrandomwhen"Random"shellisselectedinconfig.
//Also,thisdoesnotcreatetheshell,onlyreturnsthefactoryfunction.
constfastShellBlacklist=['FallingLeaves','Floral','Willow'];
functionrandomFastShell(){
	constisRandom=shellNameSelector()==='Random';
	letshellName=isRandom?randomShellName():shellNameSelector();
	if(isRandom){
		while(fastShellBlacklist.includes(shellName)){
			shellName=randomShellName();
		}
	}
	returnshellTypes[shellName];
}


constshellTypes={
	'Random':randomShell,
	'Crackle':crackleShell,
	'Crossette':crossetteShell,
	'Crysanthemum':crysanthemumShell,
	'FallingLeaves':fallingLeavesShell,
	'Floral':floralShell,
	'Ghost':ghostShell,
	'HorseTail':horsetailShell,
	'Palm':palmShell,
	'Ring':ringShell,
	'Strobe':strobeShell,
	'Willow':willowShell
};

constshellNames=Object.keys(shellTypes);

functioninit(){
	//Removeloadingstate
	document.querySelector('.loading-init').remove();
	appNodes.stageContainer.classList.remove('remove');
	
	//Populatedropdowns
	functionsetOptionsForSelect(node,options){
		node.innerHTML=options.reduce((acc,opt)=>acc+=`<optionvalue="${opt.value}">${opt.label}</optionvalue=>`,'');
	}

	//shelltype
	letoptions='';
	shellNames.forEach(opt=>options+=`<optionvalue="${opt}">${opt}</optionvalue=>`);
	appNodes.shellType.innerHTML=options;
	//shellsize
	options='';
	['3"','4"','6"','8"','12"','16"'].forEach((opt,i)=>options+=`<optionvalue="${i}">${opt}</optionvalue=>`);
	appNodes.shellSize.innerHTML=options;
	
	setOptionsForSelect(appNodes.quality,[
		{label:'Low',value:QUALITY_LOW},
		{label:'Normal',value:QUALITY_NORMAL},
		{label:'High',value:QUALITY_HIGH}
	]);
	
	setOptionsForSelect(appNodes.skyLighting,[
		{label:'None',value:SKY_LIGHT_NONE},
		{label:'Dim',value:SKY_LIGHT_DIM},
		{label:'Normal',value:SKY_LIGHT_NORMAL}
	]);
	
	//0.9ismobiledefault
	setOptionsForSelect(
		appNodes.scaleFactor,
		[0.5,0.62,0.75,0.9,1.0,1.5,2.0]
		.map(value=>({value:value.toFixed(2),label:`${value*100}%`}))
	);
	
	//Beginsimulation
	togglePause(false);
	
	//initialrender
	renderApp(store.state);
	
	//Applyinitialconfig
	configDidUpdate();
}


functionfitShellPositionInBoundsH(position){
	constedge=0.18;
	return(1-edge*2)*position+edge;
}

functionfitShellPositionInBoundsV(position){
	returnposition*0.75;
}

functiongetRandomShellPositionH(){
	returnfitShellPositionInBoundsH(Math.random());
}

functiongetRandomShellPositionV(){
	returnfitShellPositionInBoundsV(Math.random());
}

functiongetRandomShellSize(){
	constbaseSize=shellSizeSelector();
	constmaxVariance=Math.min(2.5,baseSize);
	constvariance=Math.random()*maxVariance;
	constsize=baseSize-variance;
	constheight=maxVariance===0?Math.random():1-(variance/maxVariance);
	constcenterOffset=Math.random()*(1-height*0.65)*0.5;
	constx=Math.random()<0.5?0.5-centerOffset:0.5+centerOffset;
	return{
		size,
		x:fitShellPositionInBoundsH(x),
		height:fitShellPositionInBoundsV(height)
	};
}


//Launchesashellfromauserpointerevent,basedonstate.config
functionlaunchShellFromConfig(event){
	constshell=newShell(shellFromConfig(shellSizeSelector()));
	constw=mainStage.width;
	consth=mainStage.height;
	
	shell.launch(
		event?event.x/w:getRandomShellPositionH(),
		event?1-event.y/h:getRandomShellPositionV()
	);
}


//Sequences
//-----------

functionseqRandomShell(){
	constsize=getRandomShellSize();
	constshell=newShell(shellFromConfig(size.size));
	shell.launch(size.x,size.height);
	
	letextraDelay=shell.starLife;
	if(shell.fallingLeaves){
		extraDelay=4600;
	}
	
	return900+Math.random()*600+extraDelay;
}

functionseqRandomFastShell(){
	constshellType=randomFastShell();
	constsize=getRandomShellSize();
	constshell=newShell(shellType(size.size));
	shell.launch(size.x,size.height);
	
	letextraDelay=shell.starLife;
	
	return900+Math.random()*600+extraDelay;
}

functionseqTwoRandom(){
	constsize1=getRandomShellSize();
	constsize2=getRandomShellSize();
	constshell1=newShell(shellFromConfig(size1.size));
	constshell2=newShell(shellFromConfig(size2.size));
	constleftOffset=Math.random()*0.2-0.1;
	constrightOffset=Math.random()*0.2-0.1;
	shell1.launch(0.3+leftOffset,size1.height);
	setTimeout(()=>{
		shell2.launch(0.7+rightOffset,size2.height);
	},100);
	
	letextraDelay=Math.max(shell1.starLife,shell2.starLife);
	if(shell1.fallingLeaves||shell2.fallingLeaves){
		extraDelay=4600;
	}
	
	return900+Math.random()*600+extraDelay;
}

functionseqTriple(){
	constshellType=randomFastShell();
	constbaseSize=shellSizeSelector();
	constsmallSize=Math.max(0,baseSize-1.25);
	
	constoffset=Math.random()*0.08-0.04;
	constshell1=newShell(shellType(baseSize));
	shell1.launch(0.5+offset,0.7);
	
	constleftDelay=1000+Math.random()*400;
	constrightDelay=1000+Math.random()*400;
	
	setTimeout(()=>{
		constoffset=Math.random()*0.08-0.04;
		constshell2=newShell(shellType(smallSize));
		shell2.launch(0.2+offset,0.1);
	},leftDelay);
	
	setTimeout(()=>{
		constoffset=Math.random()*0.08-0.04;
		constshell3=newShell(shellType(smallSize));
		shell3.launch(0.8+offset,0.1);
	},rightDelay);
	
	return4000;
}

functionseqPyramid(){
	constbarrageCountHalf=IS_DESKTOP?7:4;
	constlargeSize=shellSizeSelector();
	constsmallSize=Math.max(0,largeSize-3);
	constrandomMainShell=Math.random()<0.78?crysanthemumShell:ringShell;
	constrandomSpecialShell=randomShell;

	functionlaunchShell(x,useSpecial){
		constisRandom=shellNameSelector()==='Random';
		letshellType=isRandom
			?useSpecial?randomSpecialShell:randomMainShell
			:shellTypes[shellNameSelector()];
		constshell=newShell(shellType(useSpecial?largeSize:smallSize));
		constheight=x<=0.5?x/0.5:(1-x)/0.5;
		shell.launch(x,useSpecial?0.75:height*0.42);
	}
	
	letcount=0;
	letdelay=0;
	while(count<=barrageCountHalf){
		if(count===barrageCountHalf){
			setTimeout(()=>{
				launchShell(0.5,true);
			},delay);
		}else{
			constoffset=count/barrageCountHalf*0.5;
			constdelayOffset=Math.random()*30+30;
			setTimeout(()=>{
				launchShell(offset,false);
			},delay);
			setTimeout(()=>{
				launchShell(1-offset,false);
			},delay+delayOffset);
		}
		
		count++;
		delay+=200;
	}
	
	return3400+barrageCountHalf*250;
}

functionseqSmallBarrage(){
	seqSmallBarrage.lastCalled=Date.now();
	constbarrageCount=IS_DESKTOP?11:5;
	constspecialIndex=IS_DESKTOP?3:1;
	constshellSize=Math.max(0,shellSizeSelector()-2);
	constrandomMainShell=Math.random()<0.78?crysanthemumShell:ringShell;
	constrandomSpecialShell=randomFastShell();
	
	//(cos(x*5π+0.5π)+1)/2isacustomwaveboundedby0and1usedtosetvaryinglaunchheights
	functionlaunchShell(x,useSpecial){
		constisRandom=shellNameSelector()==='Random';
		letshellType=isRandom
			?useSpecial?randomSpecialShell:randomMainShell
			:shellTypes[shellNameSelector()];
		constshell=newShell(shellType(shellSize));
		constheight=(Math.cos(x*5*Math.PI+PI_HALF)+1)/2;
		shell.launch(x,height*0.75);
	}
	
	letcount=0;
	letdelay=0;
	while(count<barrageCount){
		if(count===0){
			launchShell(0.5,false)
			count+=1;
		}
		else{
			constoffset=(count+1)/barrageCount/2;
			constdelayOffset=Math.random()*30+30;
			constuseSpecial=count===specialIndex;
			setTimeout(()=>{
				launchShell(0.5+offset,useSpecial);
			},delay);
			setTimeout(()=>{
				launchShell(0.5-offset,useSpecial);
			},delay+delayOffset);
			count+=2;
		}
		delay+=200;
	}
	
	return3400+barrageCount*120;
}
seqSmallBarrage.cooldown=15000;
seqSmallBarrage.lastCalled=Date.now();


constsequences=[
	seqRandomShell,
	seqTwoRandom,
	seqTriple,
	seqPyramid,
	seqSmallBarrage
];


letisFirstSeq=true;
constfinaleCount=32;
letcurrentFinaleCount=0;
functionstartSequence(){
	if(isFirstSeq){
		isFirstSeq=false;
		if(IS_HEADER){
			returnseqTwoRandom();
		}
		else{
			constshell=newShell(crysanthemumShell(shellSizeSelector()));
			shell.launch(0.5,0.5);
			return2400;
		}
	}
	
	if(finaleSelector()){
		seqRandomFastShell();
		if(currentFinaleCount<finaleCount){
			currentFinaleCount++;
			return170;
		}
		else{
			currentFinaleCount=0;
			return6000;
		}
	}
	
	constrand=Math.random();
	
	if(rand<0.08&&Date.now()-seqSmallBarrage.lastCalled>seqSmallBarrage.cooldown){
		returnseqSmallBarrage();
	}
	
	if(rand<0.1){
		returnseqPyramid();
	}
	
	if(rand<0.6&&!IS_HEADER){
		returnseqRandomShell();
	}
	elseif(rand<0.8){
		returnseqTwoRandom();
	}
	elseif(rand<1){
		returnseqTriple();
	}
}


letactivePointerCount=0;
letisUpdatingSpeed=false;

functionhandlePointerStart(event){
	activePointerCount++;
	constbtnSize=50;
	
	if(event.y<btnSize){
		if(event.x<btnSize){
			togglePause();
			return;
		}
		if(event.x>mainStage.width/2-btnSize/2&&event.x<mainStage.width/2+btnSize/2){
			toggleSound();
			return;
		}
		if(event.x>mainStage.width-btnSize){
			toggleMenu();
			return;
		}
	}
	
	if(!isRunning())return;
	
	if(updateSpeedFromEvent(event)){
		isUpdatingSpeed=true;
	}
	elseif(event.onCanvas){
		launchShellFromConfig(event);
	}
}

functionhandlePointerEnd(event){
	activePointerCount--;
	isUpdatingSpeed=false;
}

functionhandlePointerMove(event){
	if(!isRunning())return;
	
	if(isUpdatingSpeed){
		updateSpeedFromEvent(event);
	}
}

functionhandleKeydown(event){
	//P
	if(event.keyCode===80){
		togglePause();
	}
	//O
	elseif(event.keyCode===79){
		toggleMenu();
	}
	//Esc
	elseif(event.keyCode===27){
		toggleMenu(false);
	}
}

mainStage.addEventListener('pointerstart',handlePointerStart);
mainStage.addEventListener('pointerend',handlePointerEnd);
mainStage.addEventListener('pointermove',handlePointerMove);
window.addEventListener('keydown',handleKeydown);


//Accountforwindowresizeandcustomscalechanges.
functionhandleResize(){
	constw=window.innerWidth;
	consth=window.innerHeight;
	//Trytoadoptscreensize,heedingmaximumsizesspecified
	constcontainerW=Math.min(w,MAX_WIDTH);
	//Onsmallscreens,usefulldeviceheight
	constcontainerH=w<=420?h:Math.min(h,MAX_HEIGHT);
	appNodes.stageContainer.style.width=containerW+'px';
	appNodes.stageContainer.style.height=containerH+'px';
	stages.forEach(stage=>stage.resize(containerW,containerH));
	//Accountforscale
	constscaleFactor=scaleFactorSelector();
	stageW=containerW/scaleFactor;
	stageH=containerH/scaleFactor;
}

//Computeinitialdimensions
handleResize();

window.addEventListener('resize',handleResize);


//Dynamicglobals
letcurrentFrame=0;
letspeedBarOpacity=0;
letautoLaunchTime=0;

functionupdateSpeedFromEvent(event){
	if(isUpdatingSpeed||event.y>=mainStage.height-44){
		//Onphonesit'shardtohittheedgepixelsinordertosetspeedat0or1,sosomepaddingisprovidedtomakethateasier.
		constedge=16;
		constnewSpeed=(event.x-edge)/(mainStage.width-edge*2);
		simSpeed=Math.min(Math.max(newSpeed,0),1);
		//showspeedbarafteranupdate
		speedBarOpacity=1;
		//Ifweupdatedthespeed,returntrue
		returntrue;
	}
	//Returnfalseifthespeedwasn'tupdated
	returnfalse;
}


//Extractedfunctiontokeep`update()`optimized
functionupdateGlobals(timeStep,lag){
	currentFrame++;
	
	//Alwaystrytofadeoutspeedbar
	if(!isUpdatingSpeed){
	speedBarOpacity-=lag/30;//halfasecond
		if(speedBarOpacity<0){
			speedBarOpacity=0;
		}
	}
	
	//autolaunchshells
	if(store.state.config.autoLaunch){
		autoLaunchTime-=timeStep;
		if(autoLaunchTime<=0){
			autoLaunchTime=startSequence()*1.25;
		}
	}
}


functionupdate(frameTime,lag){
	if(!isRunning())return;
	
	constwidth=stageW;
	constheight=stageH;
	consttimeStep=frameTime*simSpeed;
	constspeed=simSpeed*lag;
	
	updateGlobals(timeStep,lag);
	
	conststarDrag=1-(1-Star.airDrag)*speed;
	conststarDragHeavy=1-(1-Star.airDragHeavy)*speed;
	constsparkDrag=1-(1-Spark.airDrag)*speed;
	constgAcc=timeStep/1000*GRAVITY;
	COLOR_CODES_W_INVIS.forEach(color=>{
		//Stars
		conststars=Star.active[color];
		for(leti=stars.length-1;i>=0;i=i-1){
			conststar=stars[i];
			//Onlyupdateeachstaronceperframe.Sincecolorcanchange,it'spossibleastarcouldupdatetwicewithoutthis,leadingtoa"jump".
			if(star.updateFrame===currentFrame){
				continue;
			}
			star.updateFrame=currentFrame;
			
			star.life-=timeStep;
			if(star.life<=0){
				stars.splice(i,1);
				Star.returnInstance(star);
			}else{
				constburnRate=Math.pow(star.life/star.fullLife,0.5);
				constburnRateInverse=1-burnRate;

				star.prevX=star.x;
				star.prevY=star.y;
				star.x+=star.speedX*speed;
				star.y+=star.speedY*speed;
				//Applyairdragifstarisn't"heavy".Theheavypropertyisusedfortheshellcomets.
				if(!star.heavy){
					star.speedX*=starDrag;
					star.speedY*=starDrag;
				}
				else{
					star.speedX*=starDragHeavy;
					star.speedY*=starDragHeavy;
				}
				star.speedY+=gAcc;
				
				if(star.spinRadius){
					star.spinAngle+=star.spinSpeed*speed;
					star.x+=Math.sin(star.spinAngle)*star.spinRadius*speed;
					star.y+=Math.cos(star.spinAngle)*star.spinRadius*speed;
				}
				
				if(star.sparkFreq){
					star.sparkTimer-=timeStep;
					while(star.sparkTimer<0){
						star.sparkTimer+=star.sparkFreq*0.75+star.sparkFreq*burnRateInverse*4;
						Spark.add(
							star.x,
							star.y,
							star.sparkColor,
							Math.random()*PI_2,
							Math.random()*star.sparkSpeed*burnRate,
							star.sparkLife*0.8+Math.random()*star.sparkLifeVariation*star.sparkLife
						);
					}
				}
				
				//Handlestartransitions
				if(star.life<star.transitionTime){
					if(star.secondColor&&!star.colorChanged){
						star.colorChanged=true;
						star.color=star.secondColor;
						stars.splice(i,1);
						Star.active[star.secondColor].push(star);
						if(star.secondColor===INVISIBLE){
							star.sparkFreq=0;
						}
					}
					
					if(star.strobe){
						//Strobesinthefollowingpattern:on:off:off:on:off:offinincrementsof`strobeFreq`ms.
						star.visible=Math.floor(star.life/star.strobeFreq)%3===0;
					}
				}
			}
		}
											
		//Sparks
		constsparks=Spark.active[color];
		for(leti=sparks.length-1;i>=0;i=i-1){
			constspark=sparks[i];
			spark.life-=timeStep;
			if(spark.life<=0){
				sparks.splice(i,1);
				Spark.returnInstance(spark);
			}else{
				spark.prevX=spark.x;
				spark.prevY=spark.y;
				spark.x+=spark.speedX*speed;
				spark.y+=spark.speedY*speed;
				spark.speedX*=sparkDrag;
				spark.speedY*=sparkDrag;
				spark.speedY+=gAcc;
			}
		}
	});
	
	render(speed);
}

functionrender(speed){
	const{dpr}=mainStage;
	constwidth=stageW;
	constheight=stageH;
	consttrailsCtx=trailsStage.ctx;
	constmainCtx=mainStage.ctx;
	
	if(skyLightingSelector()!==SKY_LIGHT_NONE){
		colorSky(speed);
	}
	
	//AccountforhighDPIscreens,andcustomscalefactor.
	constscaleFactor=scaleFactorSelector();
	trailsCtx.scale(dpr*scaleFactor,dpr*scaleFactor);
	mainCtx.scale(dpr*scaleFactor,dpr*scaleFactor);
	
	trailsCtx.globalCompositeOperation='source-over';
	trailsCtx.fillStyle=`rgba(0,0,0,${store.state.config.longExposure?0.0025:0.175*speed})`;
	trailsCtx.fillRect(0,0,width,height);
	
	mainCtx.clearRect(0,0,width,height);
	
	//Drawqueuedburstflashes
	//Thesemustalsobedrawnusingsource-overduetoSafari.Seemsrenderingthegradientsusinglightendrawslargeblackboxesinstead.
	//Thankfully,theseburstflasheslookprettymuchthesameeitherway.
	while(BurstFlash.active.length){
		constbf=BurstFlash.active.pop();
		
		constburstGradient=trailsCtx.createRadialGradient(bf.x,bf.y,0,bf.x,bf.y,bf.radius);
		burstGradient.addColorStop(0.024,'rgba(255,255,255,1)');
		burstGradient.addColorStop(0.125,'rgba(255,160,20,0.2)');
		burstGradient.addColorStop(0.32,'rgba(255,140,20,0.11)');
		burstGradient.addColorStop(1,'rgba(255,120,20,0)');
		trailsCtx.fillStyle=burstGradient;
		trailsCtx.fillRect(bf.x-bf.radius,bf.y-bf.radius,bf.radius*2,bf.radius*2);
		
		BurstFlash.returnInstance(bf);
	}
	
	//Remainingdrawingontrailscanvaswilluse'lighten'blendmode
	trailsCtx.globalCompositeOperation='lighten';
	
	//Drawstars
	trailsCtx.lineWidth=Star.drawWidth;
	trailsCtx.lineCap=isLowQuality?'square':'round';
	mainCtx.strokeStyle='#fff';
 mainCtx.lineWidth=1;
	mainCtx.beginPath();
	COLOR_CODES.forEach(color=>{
		conststars=Star.active[color];
		trailsCtx.strokeStyle=color;
		trailsCtx.beginPath();
		stars.forEach(star=>{
			if(star.visible){
				trailsCtx.moveTo(star.x,star.y);
				trailsCtx.lineTo(star.prevX,star.prevY);
				mainCtx.moveTo(star.x,star.y);
				mainCtx.lineTo(star.x-star.speedX*1.6,star.y-star.speedY*1.6);
			}
		});
		trailsCtx.stroke();
	});
	mainCtx.stroke();

	//Drawsparks
	trailsCtx.lineWidth=Spark.drawWidth;
	trailsCtx.lineCap='butt';
	COLOR_CODES.forEach(color=>{
		constsparks=Spark.active[color];
		trailsCtx.strokeStyle=color;
		trailsCtx.beginPath();
		sparks.forEach(spark=>{
			trailsCtx.moveTo(spark.x,spark.y);
			trailsCtx.lineTo(spark.prevX,spark.prevY);
		});
		trailsCtx.stroke();
	});
	
	
	//Renderspeedbarifvisible
	if(speedBarOpacity){
		constspeedBarHeight=6;
		mainCtx.globalAlpha=speedBarOpacity;
		mainCtx.fillStyle=COLOR.Blue;
		mainCtx.fillRect(0,height-speedBarHeight,width*simSpeed,speedBarHeight);
		mainCtx.globalAlpha=1;
	}
	
	
	trailsCtx.setTransform(1,0,0,1,0,0);
	mainCtx.setTransform(1,0,0,1,0,0);
}


//Drawcoloredoverlaybasedoncombinedbrightnessofstars(lightupthesky!)
//Note:thisisappliedtothecanvascontainer'sbackground-color,soit'sbehindtheparticles
constcurrentSkyColor={r:0,g:0,b:0};
consttargetSkyColor={r:0,g:0,b:0};
functioncolorSky(speed){
	//Themaximumr,g,orbvaluethatwillbeused(255wouldrepresentnomaximum)
	constmaxSkySaturation=skyLightingSelector()*15;
	//Howmanystarsarerequiredintotaltoreachmaximumskybrightness
	constmaxStarCount=500;
	lettotalStarCount=0;
	//Initializeskyasblack
	targetSkyColor.r=0;
	targetSkyColor.g=0;
	targetSkyColor.b=0;
	//Addeachknowncolortosky,multipliedbyparticlecountofthatcolor.ThiswillputRGBvalueswildlyoutofbounds,butwe'llscalethembacklater.
	//Alsoadduptotalstarcount.
	COLOR_CODES.forEach(color=>{
		consttuple=COLOR_TUPLES[color];
		constcount=Star.active[color].length;
		totalStarCount+=count;
		targetSkyColor.r+=tuple.r*count;
		targetSkyColor.g+=tuple.g*count;
		targetSkyColor.b+=tuple.b*count;
	});
	
	//Clampintensityat1.0,andmaptoacustomnon-linearcurve.Thisallowsfewstarstoperceivablylightupthesky,whilemorestarscontinuetoincreasethebrightnessbutatalesserrate.Thisismoreinlinewithhumans'non-linearbrightnessperception.
	constintensity=Math.pow(Math.min(1,totalStarCount/maxStarCount),0.3);
	//Figureoutwhichcolorcomponenthasthehighestvalue,sowecanscalethemwithoutaffectingtheratios.
	//Prevent0frombeingused,sowedon'tdividebyzerointhenextstep.
	constmaxColorComponent=Math.max(1,targetSkyColor.r,targetSkyColor.g,targetSkyColor.b);
	//Scaleallcolorcomponentstoamaxof`maxSkySaturation`,andapplyintensity.
	targetSkyColor.r=targetSkyColor.r/maxColorComponent*maxSkySaturation*intensity;
	targetSkyColor.g=targetSkyColor.g/maxColorComponent*maxSkySaturation*intensity;
	targetSkyColor.b=targetSkyColor.b/maxColorComponent*maxSkySaturation*intensity;
	
	//Animatechangestocolortosmoothouttransitions.
	constcolorChange=10;
	currentSkyColor.r+=(targetSkyColor.r-currentSkyColor.r)/colorChange*speed;
	currentSkyColor.g+=(targetSkyColor.g-currentSkyColor.g)/colorChange*speed;
	currentSkyColor.b+=(targetSkyColor.b-currentSkyColor.b)/colorChange*speed;
	
	appNodes.canvasContainer.style.backgroundColor=`rgb(${currentSkyColor.r|0},${currentSkyColor.g|0},${currentSkyColor.b|0})`;
}

mainStage.addEventListener('ticker',update);


//Helperusedtosemi-randomlyspreadparticlesoveranarc
//Valuesareflexible-`start`and`arcLength`canbenegative,and`randomness`issimplyamultiplierforrandomaddition.
functioncreateParticleArc(start,arcLength,count,randomness,particleFactory){
	constangleDelta=arcLength/count;
	//Sometimesthereisanextraparticleattheend,tooclosetothestart.SubtractinghalftheangleDeltaensuresthatisskipped.
	//Wouldbenicetofixthisabetterway.
	constend=start+arcLength-(angleDelta*0.5);
	
	if(end>start){
		//Optimization:`angle=angle+angleDelta`vs.angle+=angleDelta
		//V8deoptimiseswithletcompoundassignment
		for(letangle=start;angle<end;angle=angle+angleDelta){
			particleFactory(angle+Math.random()*angleDelta*randomness);
		}
	}else{
		for(letangle=start;angle>end;angle=angle+angleDelta){
			particleFactory(angle+Math.random()*angleDelta*randomness);
		}
	}
}


/**
*Helperusedtocreateasphericalburstofparticles.
*
*@param{Number}countThedesirednumberofstars/particles.Thisvalueisasuggestion,andthe
*createdburstmayhavemoreparticles.Thecurrentalgorithmcan'tperfectly
*distributeaspecificnumberofpointsevenlyonasphere'ssurface.
*@param{Function}particleFactoryCalledonceperstar/particlegenerated.Passedtwoarguments:
*`angle`:Thedirectionofthestar/particle.
*`speed`:Amultiplerfortheparticlespeed,from0.0to1.0.
*@param{Number}startAngle=0Forsegmentedbursts,youcangenerateonlyapartialarcofparticles.This
*allowssettingthestartingarcangle(radians).
*@param{Number}arcLength=TAUThelengthofthearc(radians).Defaultstoafullcircle.
*
*@return{void}Returnsnothing;it'supto`particleFactory`tousethegivendata.
*/
functioncreateBurst(count,particleFactory,startAngle=0,arcLength=PI_2){
	//Assumingspherewithsurfaceareaof`count`,calculatevarious
	//propertiesofsaidsphere(unitisstars).
	//Radius
	constR=0.5*Math.sqrt(count/Math.PI);
	//Circumference
	constC=2*R*Math.PI;
	//HalfCircumference
	constC_HALF=C/2;
	
	//Makeaseriesofrings,sizingthemasiftheywerespacedevenly
	//alongthecurvedsurfaceofasphere.
	for(leti=0;i<=C_HALF;i++){
		constringAngle=i/C_HALF*PI_HALF;
		constringSize=Math.cos(ringAngle);
		constpartsPerFullRing=C*ringSize;
		constpartsPerArc=partsPerFullRing*(arcLength/PI_2);
		
		constangleInc=PI_2/partsPerFullRing;
		constangleOffset=Math.random()*angleInc+startAngle;
		//Eachparticleneedsabitofrandomnesstoimproveappearance.
		constmaxRandomAngleOffset=angleInc*0.33;
		
		for(leti=0;i<partsPerArc;i++){
			constrandomAngleOffset=Math.random()*maxRandomAngleOffset;
			letangle=angleInc*i+angleOffset+randomAngleOffset;
			particleFactory(angle,ringSize);
		}
	}
}




//Variousstareffects.
//Thesearedesignedtobeattachedtoastar's`onDeath`event.

//Crossettebreaksstarintofoursame-colorpieceswhichbranchinacross-likeshape.
functioncrossetteEffect(star){
	conststartAngle=Math.random()*PI_HALF;
	createParticleArc(startAngle,PI_2,4,0.5,(angle)=>{
		Star.add(
			star.x,
			star.y,
			star.color,
			angle,
			Math.random()*0.6+0.75,
			600
		);
	});
}

//Flowerislikeaminishell
functionfloralEffect(star){
	constcount=12+6*quality;
	createBurst(count,(angle,speedMult)=>{
		Star.add(
			star.x,
			star.y,
			star.color,
			angle,
			speedMult*2.4,
			1000+Math.random()*300,
			star.speedX,
			star.speedY
		);
	});
	//Queueburstflashrender
	BurstFlash.add(star.x,star.y,46);
	soundManager.playSound('burstSmall');
}

//Floralburstwithwillowstars
functionfallingLeavesEffect(star){
	createBurst(7,(angle,speedMult)=>{
		constnewStar=Star.add(
			star.x,
			star.y,
			INVISIBLE,
			angle,
			speedMult*2.4,
			2400+Math.random()*600,
			star.speedX,
			star.speedY
		);
		
		newStar.sparkColor=COLOR.Gold;
		newStar.sparkFreq=144/quality;
		newStar.sparkSpeed=0.28;
		newStar.sparkLife=750;
		newStar.sparkLifeVariation=3.2;
	});
	//Queueburstflashrender
	BurstFlash.add(star.x,star.y,46);
	soundManager.playSound('burstSmall');
}

//Cracklepopsintoasmallcloudofgoldensparks.
functioncrackleEffect(star){
	constcount=isHighQuality?32:16;
	createParticleArc(0,PI_2,count,1.8,(angle)=>{
		Spark.add(
			star.x,
			star.y,
			COLOR.Gold,
			angle,
			//applynearcubicfallofftospeed(placesmoreparticlestowardsoutside)
			Math.pow(Math.random(),0.45)*2.4,
			300+Math.random()*200
		);
	});
}



/**
*Shellcanbeconstructedwithoptions:
*
*spreadSize:Sizeoftheburst.
*starCount:Numberofstarstocreate.Thisisoptional,andwillbesettoareasonablequantityforsizeifomitted.
*starLife:
*starLifeVariation:
*color:
*glitterColor:
*glitter:Oneof:'light','medium','heavy','streamer','willow'
*pistil:
*pistilColor:
*streamers:
*crossette:
*floral:
*crackle:
*/
classShell{
	constructor(options){
		Object.assign(this,options);
		this.starLifeVariation=options.starLifeVariation||0.125;
		this.color=options.color||randomColor();
		this.glitterColor=options.glitterColor||this.color;
				
		//SetdefaultstarCountifneeded,willbebasedonshellsizeandscaleexponentially,likeasphere'ssurfacearea.
		if(!this.starCount){
			constdensity=options.starDensity||1;
			constscaledSize=this.spreadSize/54;
			this.starCount=Math.max(6,scaledSize*scaledSize*density);
		}
	}
	
	launch(position,launchHeight){
		constwidth=stageW;
		constheight=stageH;
		//Distancefromsidesofscreentokeepshells.
		consthpad=60;
		//Distancefromtopofscreentokeepshellbursts.
		constvpad=50;
		//Minimumburstheight,asapercentageofstageheight
		constminHeightPercent=0.45;
		//Minimumburstheightinpx
		constminHeight=height-height*minHeightPercent;
		
		constlaunchX=position*(width-hpad*2)+hpad;
		constlaunchY=height;
		constburstY=minHeight-(launchHeight*(minHeight-vpad));
		
		constlaunchDistance=launchY-burstY;
		//UsingacustompowercurvetoapproximateVineededtoreachlaunchDistanceundergravityandairdrag.
		//Magicnumberscamefromtesting.
		constlaunchVelocity=Math.pow(launchDistance*0.04,0.64);
		
		constcomet=this.comet=Star.add(
			launchX,
			launchY,
			typeofthis.color==='string'&&this.color!=='random'?this.color:COLOR.White,
			Math.PI,
			launchVelocity*(this.horsetail?1.2:1),
			//HangtimeisderivedlinearlyfromVi;exactnumbercamefromtesting
			launchVelocity*(this.horsetail?100:400)
		);
		
		//makingcomet"heavy"limitsairdrag
		comet.heavy=true;
		//cometsparktrail
		comet.spinRadius=MyMath.random(0.32,0.85);
		comet.sparkFreq=32/quality;
		if(isHighQuality)comet.sparkFreq=8;
		comet.sparkLife=320;
		comet.sparkLifeVariation=3;
		if(this.glitter==='willow'||this.fallingLeaves){
			comet.sparkFreq=20/quality;
			comet.sparkSpeed=0.5;
			comet.sparkLife=500;
		}
		if(this.color===INVISIBLE){
			comet.sparkColor=COLOR.Gold;
		}
		
		//Randomlymakecomet"burnout"abitearly.
		//Thisisdisabledforhorsetailshells,duetotheirveryshortairtime.
		if(Math.random()>0.4&&!this.horsetail){
			comet.secondColor=INVISIBLE;
			comet.transitionTime=Math.pow(Math.random(),1.5)*700+500;
		}
		
		comet.onDeath=comet=>this.burst(comet.x,comet.y);
		
		soundManager.playSound('lift');
	}
	
	burst(x,y){
		//Setburstspeedsooverallburstgrowstosetsize.Thisspecificformulawasderivedfromtesting,andisaffectedbysimulatedairdrag.
		constspeed=this.spreadSize/96;

		letcolor,onDeath,sparkFreq,sparkSpeed,sparkLife;
		letsparkLifeVariation=0.25;
		//Somedeatheffects,likecrackle,playasound,butshouldonlybeplayedonce.
		letplayedDeathSound=false;
		
		if(this.crossette)onDeath=(star)=>{
			if(!playedDeathSound){
				soundManager.playSound('crackleSmall');
				playedDeathSound=true;
			}
			crossetteEffect(star);
		}
		if(this.crackle)onDeath=(star)=>{
			if(!playedDeathSound){
				soundManager.playSound('crackle');
				playedDeathSound=true;
			}
			crackleEffect(star);
		}
		if(this.floral)onDeath=floralEffect;
		if(this.fallingLeaves)onDeath=fallingLeavesEffect;
		
		if(this.glitter==='light'){
			sparkFreq=400;
			sparkSpeed=0.3;
			sparkLife=300;
			sparkLifeVariation=2;
		}
		elseif(this.glitter==='medium'){
			sparkFreq=200;
			sparkSpeed=0.44;
			sparkLife=700;
			sparkLifeVariation=2;
		}
		elseif(this.glitter==='heavy'){
			sparkFreq=80;
			sparkSpeed=0.8;
			sparkLife=1400;
			sparkLifeVariation=2;
		}
		elseif(this.glitter==='thick'){
			sparkFreq=16;
			sparkSpeed=isHighQuality?1.65:1.5;
			sparkLife=1400;
			sparkLifeVariation=3;
		}
		elseif(this.glitter==='streamer'){
			sparkFreq=32;
			sparkSpeed=1.05;
			sparkLife=620;
			sparkLifeVariation=2;
		}
		elseif(this.glitter==='willow'){
			sparkFreq=120;
			sparkSpeed=0.34;
			sparkLife=1400;
			sparkLifeVariation=3.8;
		}
		
		//Applyqualitytosparkcount
		sparkFreq=sparkFreq/quality;
		
		//Starfactoryforprimaryburst,pistils,andstreamers.
		letfirstStar=true;
		conststarFactory=(angle,speedMult)=>{
			//Fornon-horsetailshells,computeaninitialverticalspeedtoaddtostarburst.
			//Themagicnumbercomesfromtestingwhatlooksbest.Theidealisthatallshell
			//burstsappearvisuallycenteredforthemajorityofthestarlife(excl.willowsetc.)
			conststandardInitialSpeed=this.spreadSize/1800;
			
			conststar=Star.add(
				x,
				y,
				color||randomColor(),
				angle,
				speedMult*speed,
				//addminorvariationtostarlife
				this.starLife+Math.random()*this.starLife*this.starLifeVariation,
				this.horsetail?this.comet&&this.comet.speedX:0,
				this.horsetail?this.comet&&this.comet.speedY:-standardInitialSpeed
			);
	
			if(this.secondColor){
				star.transitionTime=this.starLife*(Math.random()*0.05+0.32);
				star.secondColor=this.secondColor;
			}

			if(this.strobe){
				star.transitionTime=this.starLife*(Math.random()*0.08+0.46);
				star.strobe=true;
				//Howmanymillisecondsbetweenswitchofstrobestate"tick".Notethatthestrobepattern
				//ison:off:off,sothisisthe"on"duration,whilethe"off"durationistwiceaslong.
				star.strobeFreq=Math.random()*20+40;
				if(this.strobeColor){
					star.secondColor=this.strobeColor;
				}
			}
			
			star.onDeath=onDeath;

			if(this.glitter){
				star.sparkFreq=sparkFreq;
				star.sparkSpeed=sparkSpeed;
				star.sparkLife=sparkLife;
				star.sparkLifeVariation=sparkLifeVariation;
				star.sparkColor=this.glitterColor;
				star.sparkTimer=Math.random()*star.sparkFreq;
			}
		};
		
		
		if(typeofthis.color==='string'){
			if(this.color==='random'){
				color=null;//falseyvaluecreatesrandomcolorinstarFactory
			}else{
				color=this.color;
			}
			
			//Ringshavepositionalrandomness,butarerotatedrandomly
			if(this.ring){
				constringStartAngle=Math.random()*Math.PI;
				constringSquash=Math.pow(Math.random(),2)*0.85+0.15;;
				
				createParticleArc(0,PI_2,this.starCount,0,angle=>{
					//Createaring,squashedhorizontally
					constinitSpeedX=Math.sin(angle)*speed*ringSquash;
					constinitSpeedY=Math.cos(angle)*speed;
					//Rotatering
					constnewSpeed=MyMath.pointDist(0,0,initSpeedX,initSpeedY);
					constnewAngle=MyMath.pointAngle(0,0,initSpeedX,initSpeedY)+ringStartAngle;
					conststar=Star.add(
						x,
						y,
						color,
						newAngle,
						//applynearcubicfallofftospeed(placesmoreparticlestowardsoutside)
						newSpeed,//speed,
						//addminorvariationtostarlife
						this.starLife+Math.random()*this.starLife*this.starLifeVariation
					);
					
					if(this.glitter){
						star.sparkFreq=sparkFreq;
						star.sparkSpeed=sparkSpeed;
						star.sparkLife=sparkLife;
						star.sparkLifeVariation=sparkLifeVariation;
						star.sparkColor=this.glitterColor;
						star.sparkTimer=Math.random()*star.sparkFreq;
					}
				});
			}
			//Normalburst
			else{
				createBurst(this.starCount,starFactory);
			}
		}
		elseif(Array.isArray(this.color)){
			if(Math.random()<0.5){
				conststart=Math.random()*Math.PI;
				conststart2=start+Math.PI;
				constarc=Math.PI;
				color=this.color[0];
				//Notcreatingafullarcautomaticallyreducesstarcount.
				createBurst(this.starCount,starFactory,start,arc);
				color=this.color[1];
				createBurst(this.starCount,starFactory,start2,arc);
			}else{
				color=this.color[0];
				createBurst(this.starCount/2,starFactory);
				color=this.color[1];
				createBurst(this.starCount/2,starFactory);
			}
		}
		else{
			thrownewError('Invalidshellcolor.Expectedstringorarrayofstrings,butgot:'+this.color);
		}
		
		if(this.pistil){
			constinnerShell=newShell({
				spreadSize:this.spreadSize*0.5,
				starLife:this.starLife*0.6,
				starLifeVariation:this.starLifeVariation,
				starDensity:1.4,
				color:this.pistilColor,
				glitter:'light',
				glitterColor:this.pistilColor===COLOR.Gold?COLOR.Gold:COLOR.White
			});
			innerShell.burst(x,y);
		}
		
		if(this.streamers){
			constinnerShell=newShell({
				spreadSize:this.spreadSize*0.9,
				starLife:this.starLife*0.8,
				starLifeVariation:this.starLifeVariation,
				starCount:Math.floor(Math.max(6,this.spreadSize/45)),
				color:COLOR.White,
				glitter:'streamer'
			});
			innerShell.burst(x,y);
		}
		
		//Queueburstflashrender
		BurstFlash.add(x,y,this.spreadSize/4);

		//Playsound,butonlyfor"original"shell,theonethatwaslaunched.
		//Wedon'twantmultiplesoundsfrompistilorstreamer"sub-shells".
		//Thiscanbedetectedbythepresenceofacomet.
		if(this.comet){
			//Scaleexplosionsoundbasedoncurrentshellsizeandselected(max)shellsize.
			//Shootingselectedshellsizewillalwayssoundthesamenomattertheselectedsize,
			//butwhensmallershellsareauto-fired,theywillsoundsmaller.Itdoesn'tsoundgreat
			//whenavaluetoosmallisgiventhough,soinsteadofbasingitonproportions,wejust
			//lookatthedifferenceinsizeandmapittoarangeknowntosoundgood.
			constmaxDiff=2;
			constsizeDifferenceFromMaxSize=Math.min(maxDiff,shellSizeSelector()-this.shellSize);
			constsoundScale=(1-sizeDifferenceFromMaxSize/maxDiff)*0.3+0.7;
			soundManager.playSound('burst',soundScale);
		}
	}
}



constBurstFlash={
	active:[],
	_pool:[],
	
	_new(){
		return{}
	},
	
	add(x,y,radius){
		constinstance=this._pool.pop()||this._new();
		
		instance.x=x;
		instance.y=y;
		instance.radius=radius;
		
		this.active.push(instance);
		returninstance;
	},
	
	returnInstance(instance){
		this._pool.push(instance);
	}
};



//Helpertogenerateobjectsforstoringactiveparticles.
//Particlesarestoredinarrayskeyedbycolor(code,notname)forimprovedrenderingperformance.
functioncreateParticleCollection(){
	constcollection={};
	COLOR_CODES_W_INVIS.forEach(color=>{
		collection[color]=[];
	});
	returncollection;
}


//Starproperties(WIP)
//-----------------------
//transitionTime-howclosetoendoflifethatstartransitionhappens

constStar={
	//Visualproperties
	drawWidth:3,
	airDrag:0.98,
	airDragHeavy:0.992,
	
	//Starparticleswillbekeyedbycolor
	active:createParticleCollection(),
	_pool:[],
	
	_new(){
		return{};
	},

	add(x,y,color,angle,speed,life,speedOffX,speedOffY){
		constinstance=this._pool.pop()||this._new();
		
		instance.visible=true;
		instance.heavy=false;
		instance.x=x;
		instance.y=y;
		instance.prevX=x;
		instance.prevY=y;
		instance.color=color;
		instance.speedX=Math.sin(angle)*speed+(speedOffX||0);
		instance.speedY=Math.cos(angle)*speed+(speedOffY||0);
		instance.life=life;
		instance.fullLife=life;
		instance.spinAngle=Math.random()*PI_2;
		instance.spinSpeed=0.8;
		instance.spinRadius=0;
		instance.sparkFreq=0;//msbetweensparkemissions
		instance.sparkSpeed=1;
		instance.sparkTimer=0;
		instance.sparkColor=color;
		instance.sparkLife=750;
		instance.sparkLifeVariation=0.25;
		instance.strobe=false;
		
		this.active[color].push(instance);
		returninstance;
	},

	//Publicmethodforcleaningupandreturninganinstancebacktothepool.
	returnInstance(instance){
		//CallonDeathhandlerifavailable(andpassitcurrentstarinstance)
		instance.onDeath&&instance.onDeath(instance);
		//Cleanup
		instance.onDeath=null;
		instance.secondColor=null;
		instance.transitionTime=0;
		instance.colorChanged=false;
		//Addbacktothepool.
		this._pool.push(instance);
	}
};


constSpark={
	//Visualproperties
	drawWidth:0,//setin`configDidUpdate()`
	airDrag:0.9,
	
	//Starparticleswillbekeyedbycolor
	active:createParticleCollection(),
	_pool:[],
	
	_new(){
		return{};
	},

	add(x,y,color,angle,speed,life){
		constinstance=this._pool.pop()||this._new();
		
		instance.x=x;
		instance.y=y;
		instance.prevX=x;
		instance.prevY=y;
		instance.color=color;
		instance.speedX=Math.sin(angle)*speed;
		instance.speedY=Math.cos(angle)*speed;
		instance.life=life;
		
		this.active[color].push(instance);
		returninstance;
	},

	//Publicmethodforcleaningupandreturninganinstancebacktothepool.
	returnInstance(instance){
		//Addbacktothepool.
		this._pool.push(instance);
	}
};



constsoundManager={
	baseURL:'https://s3-us-west-2.amazonaws.com/s.cdpn.io/329180/',
	ctx:new(window.AudioContext||window.webkitAudioContext),
	sources:{
		lift:{
			volume:1,
			playbackRateMin:0.85,
			playbackRateMax:0.95,
			fileNames:[
				'lift1.mp3',
				'lift2.mp3',
				'lift3.mp3'
			]
		},
		burst:{
			volume:1,
			playbackRateMin:0.8,
			playbackRateMax:0.9,
			fileNames:[
				'burst1.mp3',
				'burst2.mp3'
			]
		},
		burstSmall:{
			volume:0.25,
			playbackRateMin:0.8,
			playbackRateMax:1,
			fileNames:[
				'burst-sm-1.mp3',
				'burst-sm-2.mp3'
			]
		},
		crackle:{
			volume:0.2,
			playbackRateMin:1,
			playbackRateMax:1,
			fileNames:['crackle1.mp3']
		},
		crackleSmall:{
			volume:0.3,
			playbackRateMin:1,
			playbackRateMax:1,
			fileNames:['crackle-sm-1.mp3']
		}
	},

	preload(){
		constallFilePromises=[];

		functioncheckStatus(response){
			if(response.status>=200&&response.status<300){
				returnresponse;
			}
			constcustomError=newError(response.statusText);
			customError.response=response;
			throwcustomError;
		}

		consttypes=Object.keys(this.sources);
		types.forEach(type=>{
			constsource=this.sources[type];
			const{fileNames}=source;
			constfilePromises=[];
			fileNames.forEach(fileName=>{
				constfileURL=this.baseURL+fileName;
				//Promisewillresolvewithdecodedaudiobuffer.
				constpromise=fetch(fileURL)
					.then(checkStatus)
					.then(response=>response.arrayBuffer())
					.then(data=>newPromise(resolve=>{
						this.ctx.decodeAudioData(data,resolve);
					}));

				filePromises.push(promise);
				allFilePromises.push(promise);
			});

			Promise.all(filePromises)
				.then(buffers=>{
					source.buffers=buffers;
				});
		});

		returnPromise.all(allFilePromises);
	},
	
	pauseAll(){
		this.ctx.suspend();
	},

	resumeAll(){
		//PlayasoundwithnovolumeforiOS.This'unlocks'theaudiocontextwhentheuserfirstenablessound.
		this.playSound('lift',0);
		//Chromemobilerequiresinteractionbeforestartingaudiocontext.
		//Thesoundtogglebuttonistriggeredon'touchstart',whichdoesn'tseemtocountasafull
		//interactiontoChrome.Iguessitneedsaclick?Atanyrateifthefirstthingtheuserdoes
		//isenableaudio,itdoesn'twork.UsingasetTimeoutallowsthefirstinteractiontoberegistered.
		//Perhapsabettersolutionistotrackwhethertheuserhasinteracted,andifnotbuttheytryenabling
		//sound,showatooltipthattheyshouldtapagaintoenablesound.
		setTimeout(()=>{
			this.ctx.resume();
		},250);
	},
	
	//Privatepropertyusedtothrottlesmallburstsounds.
	_lastSmallBurstTime:0,

	/**
	*Playasoundof`type`.Willrandomlypickafileassociatedwithtype,andplayitatthespecifiedvolume
	*andplayspeed,withabitofrandomvarianceinplayspeed.Thisisallbasedon`sources`config.
	*
	*@param{string}type-Thetypeofsoundtoplay.
	*@param{?number}scale=1-Valuebetween0and1(valuesoutsiderangewillbeclamped).Scaleslessthanone
	*descreasevolumeandincreaseplaybackspeed.Thisisbecauselargeexplosionsare
	*louder,deeper,andreverberatelongerthansmallexplosions.
	*Notethatascaleof0willmutethesound.
	*/
	playSound(type,scale=1){
		//Ensure`scale`iswithinvalidrange.
		scale=MyMath.clamp(scale,0,1);

		//Disallowstartingnewsoundsifsoundisdisabled,appisrunninginslowmotion,orpaused.
		//Slowmotioncheckhassomewiggleroomincaseuserdoesn'tfinishdraggingthespeedbar
		//*all*thewayback.
		if(!canPlaySoundSelector()||simSpeed<0.95){
			return;
		}
		
		//Throttlesmallbursts,sincefloral/fallingleavesshellshavealotofthem.
		if(type==='burstSmall'){
			constnow=Date.now();
			if(now-this._lastSmallBurstTime<20){
				return;
			}
			this._lastSmallBurstTime=now;
		}
		
		constsource=this.sources[type];

		if(!source){
			thrownewError(`Soundoftype"${type}"doesn'texist.`);
		}
		
		constinitialVolume=source.volume;
		constinitialPlaybackRate=MyMath.random(
			source.playbackRateMin,
			source.playbackRateMax
		);
		
		//Volumedescreaseswithscale.
		constscaledVolume=initialVolume*scale;
		//Playbackrateincreaseswithscale.Forthis,wemapthescaleof0-1toascaleof2-1.
		//Soatascaleof1,soundplaysnormally,butasscaleapproaches0speedapproachesdouble.
		constscaledPlaybackRate=initialPlaybackRate*(2-scale);
		
		constgainNode=this.ctx.createGain();
		gainNode.gain.value=scaledVolume;

		constbuffer=MyMath.randomChoice(source.buffers);
		constbufferSource=this.ctx.createBufferSource();
		bufferSource.playbackRate.value=scaledPlaybackRate;
		bufferSource.buffer=buffer;
		bufferSource.connect(gainNode);
		gainNode.connect(this.ctx.destination);
		bufferSource.start(0);
	}
};




//Kickthingsoff.

functionsetLoadingStatus(status){
	document.querySelector('.loading-init__status').textContent=status;
}

//CodePenprofileheaderdoesn'tneedaudio,justinitialize.
if(IS_HEADER){
	init();
}else{
	//Allowstatustorender,thenpreloadassetsandstartapp.
	setLoadingStatus('LightingFuses');
	setTimeout(()=>{
		soundManager.preload()
		.then(
			init,
			reason=>{
				//Codepenpreviewdoesn'tliketoloadtheaudio,sojustinittofixthepreviewfornow.
				init();
				//setLoadingStatus('ErrorLoadingAudio');
				returnPromise.reject(reason);
			}
		);
	},0);
}