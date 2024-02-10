
var importProjectBtn = document.getElementById("importProjectBtn");

var exportProjectBtn = document.getElementById("exportProjectBtn");
var exportPDFBtn = document.getElementById("exportPDFBtn");

var newProjectBtn = document.getElementById("newProjectBtn");
var newDiagramBtn = document.getElementById("newDiagram");
var viewAllDiagramsBtn = document.getElementById("viewAllDiagrams");

var checkColors = document.getElementById("checkColors");
var checkDarkMode = document.getElementById("checkDarkMode");
// var checkObjects = document.getElementById("checkObjects");

var historialBtn = document.getElementById("historialBtn");

var histPopup = document.getElementById("hist-popup");

var buttonOpenBlocks = document.getElementById("buttonOpenBlocks");
var buttonCloseBlocks = document.getElementById("buttonCloseBlocks");

var applyNewCustomStyles = document.getElementById("applyNewCustomStyles");

function initButtons(prj) {
	if (!prj) return;

	setEvent(exportProjectBtn, "click", exportProject);

	setEvent(importProjectBtn, "click", importProject);
	(!prj.et) ? setEvent(exportPDFBtn, "click", exportPDFForStudent) : exportPDFBtn.className += " disabled";
	setInsertButtonsEvents();

	setEvent(newProjectBtn, "click", handleNewProject);
	setEvent(newDiagramBtn, "click", handleNewDiagram);
	setEvent(viewAllDiagramsBtn, "click", handleAllViewDiagrams);

	setEvent(checkColors, "click", handleCheckColors);
	setEvent(checkDarkMode, "click", handleCheckDarkMode);
	// setEvent(checkObjects, "click", handleCheckObjects);

	setEvent(buttonOpenBlocks, "click", openBlocksContainerHandler);
	setEvent(buttonCloseBlocks, "click", closeBlocksContainerHandler);

	setEvent(applyNewCustomStyles, "click", handleApplyNewCustomStyles);
	
	function setInsertButtonsEvents() {
		var diagramButtons = document.getElementById("diagramButtons").children;
		var button;

		for (let b = 0; b < diagramButtons.length; b++) {
			button = diagramButtons[b];
			setEvent(button, "click", handleClickButtonDiagram);
		}
	}
}

function updateButtons(prj) {
	if (!prj) return;

	if (prj.et) {
		removeEvent(exportPDFBtn, "click", exportPDFForStudent);
		exportPDFBtn.className += " disabled";
	} else {
		setEvent(exportPDFBtn, "click", exportPDFForStudent);
		exportPDFBtn.className = exportPDFBtn.className.replace(" disabled", "");
	}
}
