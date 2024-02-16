var diagramMaker = new XNSDiagramMaker();
var project;
var diagramContainer;
var diagramsMenu;
var statementsMenu;
var PDF;
var urlParams;
var trash = document.getElementById("trash");

// Drag and drop variables
var mode;
var template;
var id;
var origin;
var isDraggable;

function drag(e) {
	if (this.template)
		mode = "copy";
	else
		mode = "move";
	template = this.template;
	id = e.target.id;
	setTimeout(() => {
		applyClassInNode(false, "invisible", trash);
		expandEmptys(true);
	}, 100);
}

function drop(ev) {
	var statement, deleteEmpty = true;

	ev.preventDefault();
	if (typeof ev.dataTransfer !== "undefined" && ev.dataTransfer.files.length > 0) {
		importDiagram(ev.dataTransfer.files[0]);
	} else {
		if (mode == "copy") {
			statement = renderStatement(JSON.parse(template));
			empty = newEmptyBlock();
			deleteEmpty = false;
			if (statement.getAttribute("type") == "switch")
				diagramContainer.makeButtonAddInSwitch(statement);
		} else {
			statement = findDroppableElement(document.getElementById(id));
			if(isDraggable) {
				if (statement.className.includes("declaration")) {
					deleteEmpty = false;
					if (statement.className == "parameter-declaration" && !statement.innerHTML.includes(" , ") && diagramContainer.methodParameters.children.length > 1)
						diagramContainer.methodParameters.children[1].innerHTML = diagramContainer.methodParameters.children[1].innerHTML.substring(" , ".length);
				}
				empty = statement.nextSibling;
			}
		}

		if (ev.target == trash) {
			deleteStatement(statement, deleteEmpty);
			handleDragLeaveInTrash(ev);
		} else {
			if (!statement.className.includes("declaration")) {
				diagramContainer.insertStatementInTarget(ev.target, statement);
				handleDragLeaveInBlock(ev);
			} else {
				collapseEmptys();
			}
		}

		resizeInputs();
		handleInputs();
		drawCorners();
	}
}

function handleDragOverInBlock(ev) {
	if (ev.target.classList.contains("empty"))
		toggleClass(ev.target, "empty-hover");
}

function handleDragLeaveInBlock(ev) {
	if (ev.target.classList.contains("empty"))
		toggleClass(ev.target, "empty-hover");
}

function handleDragEnd(e) {
	applyClassInNode(true, "invisible", trash);
	expandEmptys(false);
	updateDiagram();
}

function handleTouchStart(ev) {
	origin = findDraggableElement(ev.target);
	isDraggable = typeof origin !== "undefined";
}

function findElementWithAttribute(currentElement, attribute) {
	const BODY_NODE_NAME = "BODY";
	var elementWithAttribute, hasAttribute = false;

	while(!hasAttribute && currentElement.parentElement.nodeName != BODY_NODE_NAME) {
		hasAttribute = currentElement.hasAttribute(attribute) && currentElement[attribute];
		currentElement = currentElement.parentElement;
	}

	if(hasAttribute) elementWithAttribute = currentElement;
	return elementWithAttribute;
}
function findDraggableElement(element) {
	return findElementWithAttribute(element, "draggable");
}
function findDroppableElement(element) {
	return findElementWithAttribute(element, "droppable");
}

function collapseEmptys() {
	var emptys = document.querySelectorAll("#actualDiagram .empty");
	for (let e = 0; e < emptys.length; e++) {
		applyClassInNode(false, "expand-empty", emptys[e]);
		applyClassInNode(false, "empty-hover", emptys[e]);
	}
}

function expandEmptys(flag) {
	var emptys = document.querySelectorAll("#actualDiagram .empty");
	for (let e = 0; e < emptys.length; e++) {
		applyClassInNode(flag, "expand-empty", emptys[e]);
	}
}

function deleteStatement(statement, deleteEmpty) {
	if (deleteEmpty)
		statement.nextSibling.remove();
	statement.remove();
}

function renderStatement(statement) {
	var obj = diagramMaker[statement.type](statement.data);
	obj.setAttribute("type", statement.type);
	makeDraggable(obj);
	return obj;
}

function newEmptyBlock() {
	return diagramMaker.newBlock("empty", undefined, "true");
}

function appendDiagram(container, json) {
	diagram = diagramMaker.render(
		container,
		json.statements ?
			json : {
				statements: [json]
			}
	);
	container.classList.add("w3-card-4");
	container.json = json;
	return diagram;
}

// [P] function mk() {  return new Date().getDate(); }

function makeDraggable(obj) {
	obj.setAttribute("draggable", "true");

	setEvent(obj, "dragstart", drag);
	setEvent(obj, "dragend", handleDragEnd);

	setEvent(obj, "touchstart", drag);
	setEvent(obj, "touchend", handleDragEnd);
}

function allowDrop(ev) {
	ev.preventDefault();
	if (ev.target.getAttribute("droppable") == "true") {
		ev.dataTransfer.dropEffect = "copy"; // drop it like it's hot
	} else {
		ev.dataTransfer.dropEffect = "none"; // dropping is not allowed
	}
}

function setTrashEvents() {
	var isOverInTrash = false;

	setEvent(document.body, "touchstart", handleTouchStart);

	setEvent(document.body, "touchmove", (ev) => {
		var trashSimEvent = { origin: origin, target: trash };
		var clientX = ev.changedTouches[0].clientX;
		var clientY = ev.changedTouches[0].clientY;

		if (isDraggable && mouseInsideElement(trash, clientX, clientY)) {
			handleDragOverInTrash(trashSimEvent);
			isOverInTrash = true;
		} else if (isDraggable && isOverInTrash) {
			handleDragLeaveInTrash(trashSimEvent);
			isOverInTrash = false;
		}
	});

	setEvent(document.body, "touchend", (ev) => {
		var trashSimEvent = {
			preventDefault: () => ev.preventDefault(),
			origin: origin,
			target: trash
		};

		if (isDraggable && mouseInsideElement(trash, ev.clientX, ev.clientY)) {
			allowDrop(trashSimEvent);
			isOverInTrash = true;
		} else if (isDraggable && isOverInTrash) {
			drop(trashSimEvent);
			isOverInTrash = false;
		}
	});
	//setEvent(trash, "touchenter", handleDragOverInTrash);

	setEvent(trash, "dragenter", handleDragOverInTrash);
	setEvent(trash, "dragleave", handleDragLeaveInTrash);
	setEvent(trash, "drop", drop);
	setEvent(trash, "dragover", allowDrop);
}

function updateBeforeOpenProject() {
	document.title = document.getElementById("inputProjectName").value = project.name;
	//project.set({ "usr": urlParams.get('usuario') || "Anonimo", "com": urlParams.get('curso') || "Sin Curso" });
	diagramsMenu.clear();

	if (project.hasDiagrams) {
		project.publishTo(diagramsMenu.addDiagram);
		first = project.getFirst();
		diagramContainer.setDiagram(first);
		diagramsMenu.setActiveDiagram(first);

		handleInputs()
		resizeInputs();
		drawCorners();
	}
}

function reSize() {
	var headerHeight = parseFloat(window.getComputedStyle(document.getElementById("header")).height);
	//var footerHeight = parseFloat(window.getComputedStyle(document.getElementById("footer")).height);
	var sectionDiagram = document.getElementById("sectionDiagram");
	var menuContainer = document.getElementById("menuContainer");
	var bodyHeight;
	var newSectionDiagramHeight;
	var paddingTopSection;
	var paddingBottomSection;

	document.body.style.paddingTop = headerHeight;
	//document.body.style.paddingBottom = footerHeight;

	//var bodyHeight = parseFloat(window.getComputedStyle(document.body).height);
	bodyHeight = window.innerHeight;
	//newSectionDiagramHeight = bodyHeight - headerHeight - footerHeight - 16;
	newSectionDiagramHeight = bodyHeight - headerHeight - 16;

	sectionDiagram.style.height = newSectionDiagramHeight;
	menuContainer.style.height = newSectionDiagramHeight;
	diagramsMenu.container.style.height = newSectionDiagramHeight;

	paddingTopSection = parseFloat(window.getComputedStyle(sectionDiagram).paddingTop);
	//paddingBottomSection = parseFloat(window.getComputedStyle(sectionDiagram).paddingBottom);

	//this.diagramContainer.container.style.height = newSectionDiagramHeight - paddingTopSection - paddingBottomSection;
	this.diagramContainer.container.style.height = newSectionDiagramHeight - paddingTopSection;
}

function addDiagram(diagram) {
	diagramsMenu.addDiagram(diagram);
	project.addDiagram(diagram);
}

function deleteDiagrams() {
	var x = document.getElementById("diagramsItemsContainer").children;
	var diagram;

	for (y = x.length - 1; y >= 0; y--) {
		diagram = project.getDiagram(y);
		diagramContainer.setDiagram(diagram);
		diagramsMenu.setActiveDiagram(diagram);
		deleteDiagram(x[y]);
	}
}

function deleteDiagram(diagramItemContainer) {
	var id = diagramItemContainer.firstChild.id;
	var indexOfRemovedDiagram = project.deleteDiagram(id.substring(id.indexOf("NSP")));
	var idx;
	var diagram;

	diagramsMenu.deleteDiagram(diagramItemContainer);

	if ("item-" + diagramContainer.actualDiagram.id == id) {
		idx = (indexOfRemovedDiagram == project.hasDiagrams ? indexOfRemovedDiagram - 1 : indexOfRemovedDiagram);
		diagram = project.getDiagram(idx);

		diagramContainer.setDiagram(diagram);
		diagramsMenu.setActiveDiagram(diagram);
	}
}

function updateDiagram() {
	diagramContainer.refresh();
	diagramsMenu.updateDiagram(diagramContainer.actualDiagram);
}

function handleInputs() {
	var inputs = document.getElementsByClassName("input-for-statement");
	for (let i = 0; i < inputs.length; i++) {
		handleInput(inputs[i]);
	}
}

function resizeInputs() {
	var inputs = document.getElementsByClassName("input-for-statement");
	for (let i = 0; i < inputs.length; i++) {
		resizeInput(inputs[i]);
	}
}

function handleInput(inputObj) {
	setEvent(inputObj, "input", handleKeyDown);
	setEvent(inputObj, "change", handleChangeInput);
}

function resizeInput(inputObj) {
	var adjust = 0.5;
	inputObj.style.width = (inputObj.value.length + adjust) + "ch";
}

function handleKeyDown(e) {
	resizeInput(this);
}

function handleChangeInput(e) {
	this.setAttribute("value", this.value);
	updateDiagram();
}

function handleChangeDiagramName(e) {
	updateDiagram();
}

function loadCustomStyles() {
	const savedCustomStyles = localStorage.getItem("customStyles");
	const customStyles = document.getElementById("customStyles");
	const newCustomStyles = document.getElementById("newCustomStyles");

	if (typeof savedCustomStyles === "undefined" || savedCustomStyles == "") {
		localStorage.setItem("customStyles", "/* Pon tu CSS aqui para personalizar la web */");
	}

	customStyles.href = "data:text/css;base64," + btoa(savedCustomStyles);
	newCustomStyles.innerText = savedCustomStyles;
}

function prep() {
	_a = ((w,x) => {var z={};for(y in x){z[y]=w[x[y]]};return z})(this, {"emchange":"ub","refresh":"re"});
}

function ver() {
	return ((x) => {var z={};for(y in x){w=urlParams.get(x[y]);if(w)z[y]=w};return z})({"usr":"usuario","com":"curso","uid":"idusr","evs":"k","eve":"k2","tea":"f"});
}

function eventProc(o) {
	try {_a[o["action"]](project);}catch(e){}
}

function va(x) {
	return (function(z){
		return _validator.validate(z)})(urlParams.get('usuario'));
}

function par() {
	var v = ver();
	v.notify = eventProc;
	return v;
}
function re() { alert(atob("VGllbXBvIGRlIGV4YW1lbiE=")); ub(project); cl(); }
function cl() { deleteDiagrams(); document.getElementById("newDiagram").click() }
function isValidForPop() {
	var x = urlParams.get('idusr');
	return (x && isNaN(x));
}

function drawCorners() {
	var corners = document.querySelectorAll(".corner")
	for (let index = 0; index < corners.length; index++) {
		const corner = corners[index];
		var ctx = corner.getContext("2d");
		ctx.beginPath();
		if (corner.className.includes("true")) {
			ctx.moveTo(-1, -1);
			ctx.lineTo(corner.width + 1, corner.height + 1);
		} else {
			ctx.moveTo(corner.width + 1, -1);
			ctx.lineTo(-1, corner.height + 1);
		}
		ctx.lineWidth = 3;
		ctx.strokeStyle = '#000000';
		ctx.stroke();
	}
}

function setHPopup() {
	new PopupHandler({
		popup: histPopup,
		button: historialBtn,
		open: function (elems) { project.fillHistorial(elems.popup) },
		close: function (elems) { if (elems.popup) elems.popup.innerHTML = "" },
		visible: false
	})
}

/*function check() {
	urlParams = new URLSearchParams(window.location.search);
	(function (a ,b, c, d) { ((a) ? b : c)(d)}) (urlParams.get('f') == mk(), show, checkOrigin, urlParams);
}*/

function ce(e) { clearAllChilds(document.body); alert(e); }

function init() {
	try {
		prep();
		loadCustomStyles();
		//check();
		document.getElementById("javascriptNeeded").classList.remove("invisible");
		urlParams = new URLSearchParams(window.location.search);
		setEvent(window, "load", reSize);
		setEvent(window, "resize", reSize);
		if (!urlParams.get("mode")) setEvent(window, "beforeunload", handleClose);
		setTrashEvents();
		project = new NSPProject(par());
		diagramContainer = new DiagramContainer();
		diagramsMenu = new DiagramsMenu();
		statementsMenu = new StatementsMenu();
		PDF = new NSPPDF();
		setEvent(document.getElementById("inputProjectName"), "change", () => { document.title = project.name = this.value; });
		initButtons(project);
		addDiagram(diagramContainer.actualDiagram);
		resizeInputs();
		handleInputs();
		drawCorners();
		if (isValidForPop()) { setHPopup(); }
	} catch (e) {
		ce(e);
	}
}

var ub = updateButtons;
init();
