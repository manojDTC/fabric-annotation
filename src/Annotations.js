import { useState, useEffect } from "react";
import { fabric } from "fabric";
import polygonIcon from "../src/images/polygon.png";
import rectangleIcon from "../src/images/rectangle.png";
import deleteIcon from "../src/images/delete (2).png";
import zoomInIcon from "../src/images/zoomin.png";
import zoomOutIcon from "../src/images/zoomout.png";
import pan from "../src/images/pan.png";
import select from "../src/images/select-15.png";
import reset from "../src/images/reset.png";
function App() {
  // const [canvas, setCanvas] = useState(null);
  // const [lastPosX, setLastPosX] = useState(0);
  // const [lastPosY, setLastPosY] = useState(0);
  // const [origX, setOrigX] = useState(0);
  // const [origY, setOrigY] = useState(0);
  // const [isEditing, setIsEditing] = useState(false);
  // const [isDrawing, setIsDrawing] = useState(false);
  // const [isPanning, setIsPanning] = useState(false);
  // const [isDragging, setIsDragging] = useState(false);
  // const [points, setPoints] = useState(null);
  // const [modifiedObject, setModifiedObject] = useState(null);
  // const [selectedToolId, setSelectedToolId] = useState(null);
  // const [originalImage, setOriginalImage] = useState(null);
  // const [tool, setTool] = useState("select");
  // const [annotations, setAnnotations] = useState([]);
  // const [modifiedRectPoints, setModifiedRectPoints] = useState([]);
  // const [modifiedPolyPoints, setModifiedPolyPoints] = useState([]);
  // const [rectPoints, setRectPoints] = useState([]);
  // const [polygonObject, setPolygonObject] = useState([]);
  // const [polygonPoints, setPolygonPoints] = useState([]);
  // const [objectsAdded, setObjectAdded] = useState([]);
  // const [fabricRectPoints, setFabricRectPoints] = useState({});
  const [showAnnotationEditor, setShowAnnotationEditor] = useState(false);
  const [labels, setLabels] = useState([
    { id: "1", label: "Present", color: "#ff000042" },
    { id: "2", label: "Absent", color: "#80008033" },
    { id: "3", label: "Not Sure", color: "#ffff002e" },
  ]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [addedLabelsList, setAddedLabelsList] = useState([]);

  // let labels = [
  //   { id: "1", label: "Present", color: "#ff000042" },
  //   { id: "2", label: "Absent", color: "#80008033" },
  //   { id: "3", label: "Not Sure", color: "#ffff002e" },
  // ];

  useEffect(() => {
    let canvas = null;
    let lastPosXMain = 0;
    let lastPosYMain = 0;
    let origX = 0;
    let origY = 0;
    let isEditing = false;
    let isDrawing = false;
    let isPanning = false;
    let isDragging = false;
    let points = null;
    let tool = "select";
    let annotations = [];
    let fabricRectPoints = {};
    let modifiedRectPoints = [];
    let modifiedPolyPoints = [];
    let rectPoints = [];
    let rect = [];
    let selectedtoolId = null;
    let polygonObject = [];
    let polygonPoints = [];
    let originalImage = null;
    let labelsAdded = [];

    let canvasId = document.getElementById("canvas");

    canvas = new fabric.Canvas(canvasId, {
      width: 800,
      height: 500,
      backgroundColor: "lightgrey",
    });

    const backgroundImageUrl = "https://picsum.photos/500/600";

    // Load background image
    fabric.Image.fromURL(backgroundImageUrl, function (img) {
      img.scaleToWidth(canvas.width);
      img.scaleToHeight(canvas.height);

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        opacity: 1,
        scaleX: canvas.width / img.width,
        scaleY: canvas.height / img.height,
      });
      originalImage = img;
    });

    let lastPosX, lastPosY;

    canvas.on("object:modified", function (options) {
      let modifiedObject = options.target;

      checkBoundaries(modifiedObject);
      if (modifiedObject && modifiedObject.type === "polygon") {
        let editedPoints = [];
        let objectLeft = modifiedObject.left;
        let objectTop = modifiedObject.top;

        modifiedObject.points.forEach(function (point) {
          editedPoints.push({
            x: point.x + objectLeft,
            y: point.y + objectTop,
          });
        });

        let editableIndex = annotations.findIndex(
          (obj) => obj.id === modifiedObject.id
        );

        if (editableIndex !== -1) {
          annotations[editableIndex].polygonPoints = editedPoints;
        }
      }
    });

    canvas.on("mouse:down", function (options) {
      if (isPanning) {
        isDragging = true;
        lastPosX = options.e.clientX;
        lastPosY = options.e.clientY;
      }

      if (tool === "select") {
        selectAnnotationFromCanvas(options);
      }

      if (tool === "poly") {
        isDrawing = false;
      }

      if (tool === "rect") {
        isPanning = false;
      }

      lastPosXMain = options.e.clientX;
      lastPosYMain = options.e.clientY;
      let activeObject = canvas.getActiveObject();

      if (activeObject) {
        isDrawing = false;
      } else {
        selectedtoolId = null;
        const allAnno = canvas.getObjects();
        const lastAnno = allAnno[allAnno.length - 1];
        if (allAnno.length > 0 && lastAnno.type !== "circle") {
          let index = annotations.findIndex((obj) => obj.id === lastAnno.id);

          if (index === -1) {
            canvas.remove(lastAnno);
            canvas.renderAll();
            setShowAnnotationEditor(false);
          }
        }
      }

      if (isDrawing) {
        var pointer = canvas.getPointer(options.e);
        origX = pointer.x;
        origY = pointer.y;
      }

      if (!activeObject && isEditing) {
        setShowAnnotationEditor(false);
      }
    });

    canvas.on("mouse:move", function (options) {
      if (isDragging) {
        if (isPanning === true && options && options.e) {
          let e = options.e;
          let deltaX = e.clientX - lastPosX;
          let deltaY = e.clientY - lastPosY;

          lastPosX = e.clientX;
          lastPosY = e.clientY;

          // Check if panning is in progress
          if (canvas) {
            var newLeft = canvas.viewportTransform[4] + deltaX;
            var newTop = canvas.viewportTransform[5] + deltaY;

            if (
              newLeft <= 0 &&
              newTop <= 0 &&
              newLeft + canvas.width * canvas.getZoom() >= canvas.width &&
              newTop + canvas.height * canvas.getZoom() >= canvas.height
            ) {
              canvas.relativePan(new fabric.Point(deltaX, deltaY));
            }
          }
        }
      }
    });

    canvas.on("mouse:up", function (event) {
      isDragging = false;
      if (isDrawing) {
        let pointer = canvas.getPointer(event.e);
        if (tool === "rect") {
          createRectangle(pointer);
        }
      }

      isDrawing = true;
      event.e.preventDefault();
      event.e.stopPropagation();
    });

    canvas.on("mouse:wheel", function (opt) {
      var delta = opt.e.deltaY;

      if (delta > 0) {
        canvas.defaultCursor = "zoom-out";
        zoomOut();
      } else {
        canvas.defaultCursor = "zoom-in";
        zoomIn();
      }
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    function checkBoundaries(object) {
      if (object) {
        // Calculate the maximum allowed values for left and top
        let maxLeft = canvas.width - object.getScaledWidth();
        let maxTop = canvas.height - object.getScaledHeight();

        // Ensure that left and top are within the canvas boundaries
        object.set({
          left: Math.max(0, Math.min(object.left, maxLeft)),
          top: Math.max(0, Math.min(object.top, maxTop)),
        });

        // Calculate the right and bottom edges of the object
        let rightEdge = object.left + object.getScaledWidth();
        let bottomEdge = object.top + object.getScaledHeight();

        // Adjust the right and bottom edges if they go beyond the canvas boundaries
        if (rightEdge > canvas.width) {
          object.set({
            left: canvas.width - object.getScaledWidth(),
          });
        }

        if (bottomEdge > canvas.height) {
          object.set({
            top: canvas.height - object.getScaledHeight(),
          });
        }

        // Make sure to call `setCoords()` to update the object's coordinates properly
        object.setCoords();

        canvas.renderAll();
      }
    }

    //#region Select annotation from Canvas
    function selectAnnotationFromCanvas(event) {
      let target = event.target;
      if (target) {
        canvas.setActiveObject(target);
        canvas.renderAll();
      }
    }
    //#endregion

    //#region Handle Rectangle Tool
    const handleRectangleTool = () => {
      tool = "rect";
      canvas.selection = true;
      canvas.defaultCursor = "crosshair";
      isDrawing = true;
      selectedtoolId = null;
      canvas.discardActiveObject();
      canvas.renderAll();
    };
    //#endregion

    function addRectangle(id, x, y, x1, y1, fill) {
      var tmpRect = new fabric.Rect({
        left: x,
        top: y,
        width: x1 - x,
        height: y1 - y,
        fill: fill,
        stroke: "black",
        strokeWidth: 1,
        objectCaching: false,
        strokeUniform: true,
        cornerSize: 6,
        selectable: false,
      });

      tmpRect.toObject = (function (toObject) {
        return function () {
          return fabric.util.object.extend(toObject.call(this), {
            id: this.id,
            label: this.label,
          });
        };
      })(tmpRect.toObject);

      tmpRect.id = id;

      canvas.add(tmpRect);
      checkBoundaries(tmpRect);
      isDrawing = true;
      tmpRect.on("modified", function (options) {
        let modifiedObjectRect = options.target;
        checkBoundaries(modifiedObjectRect);
        let modifiedRectPointsOnCreate = [
          { x: rect.left, y: rect.top },
          { x: rect.left + rect.width, y: rect.top },
          { x: rect.left + rect.width, y: rect.top + rect.height },
          { x: rect.left, y: rect.top + rect.height },
        ];

        let editableIndex = annotations.findIndex(
          (obj) => obj.id === tmpRect.id
        );
        if (editableIndex !== -1) {
          annotations[editableIndex].rectanglePoints =
            modifiedRectPointsOnCreate;
        }
      });
      fabricRectPoints = tmpRect;
      return tmpRect;
    }

    function createRectangle(pointer) {
      if (isDrawing) {
        var rectWidth = pointer.x - origX;
        var rectHeight = pointer.y - origY;

        // Check if all x, y points are equal
        if (rectWidth !== 0 || rectHeight !== 0) {
          var rectangle = addRectangle(
            "rect_count_" + (annotations.length + 1),
            origX,
            origY,
            pointer.x,
            pointer.y,
            "#c7c5c54f"
          );
          rect = rectangle;

          let tmpRectPoints = [
            { x: origX, y: origY },
            { x: origX + rectWidth, y: origY },
            { x: origX + rectWidth, y: origY + rectHeight },
            { x: origX, y: origY + rectHeight },
          ];

          fabric.Object.prototype.transparentCorners = false;
          fabric.Object.prototype.cornerColor = "black";
          fabric.Object.prototype.cornerStyle = "circle";
          fabric.Rect.prototype._controlsVisibility = {
            mtr: false,
          };

          rectPoints = tmpRectPoints;
          modifiedRectPoints = tmpRectPoints;

          canvas.setActiveObject(rect);
          canvas.renderAll();

          isDrawing = true;
          isEditing = false;
          setShowAnnotationEditor(true);
          setSelectedLabel("");
        }
      }
    }

    function addPolygon() {
      tool = "poly";
      let isCreatingPolygon = true;
      let tmpPolygonPoints = [];
      selectedtoolId = null;
      canvas.selection = false;
      isDrawing = false;
      let lineIndicatorFromFirst;
      let lineIndicatorFromLast;
      let line;
      let fillShape;
      let polygonFillPoints; // Store the reference to the filled polygon
      canvas.discardActiveObject();
      canvas.renderAll();

      if (tool === "poly") {
        canvas.on("mouse:move", function (event) {
          let pointer = canvas.getPointer(event.e);

          // Check if polygon creation is in progress
          if (isCreatingPolygon) {
            // Remove existing dotted lines
            if (lineIndicatorFromFirst) {
              canvas.remove(lineIndicatorFromFirst);
            }
            if (lineIndicatorFromLast) {
              canvas.remove(lineIndicatorFromLast);
            }
            if (fillShape) {
              canvas.remove(fillShape);
            }

            // Create dotted lines from the first and last points to the current mouse position
            if (tmpPolygonPoints.length > 0) {
              // Dotted line from the first point to the current mouse position
              lineIndicatorFromFirst = new fabric.Line(
                [
                  tmpPolygonPoints[0].x,
                  tmpPolygonPoints[0].y,
                  pointer.x,
                  pointer.y,
                ],
                {
                  strokeDashArray: [5, 5],
                  stroke: "black",
                  strokeWidth: 1,
                  selectable: false,
                  evented: false,
                }
              );
              canvas.add(lineIndicatorFromFirst);

              // Dotted line from the last point to the current mouse position
              lineIndicatorFromLast = new fabric.Line(
                [
                  tmpPolygonPoints[tmpPolygonPoints.length - 1].x,
                  tmpPolygonPoints[tmpPolygonPoints.length - 1].y,
                  pointer.x,
                  pointer.y,
                ],
                {
                  strokeDashArray: [5, 5],
                  stroke: "black",
                  strokeWidth: 1,
                  selectable: false,
                  evented: false,
                }
              );
              canvas.add(lineIndicatorFromLast);
              polygonFillPoints = [];
              tmpPolygonPoints.forEach(function (point) {
                polygonFillPoints.push({ x: point.x, y: point.y });
              });
              polygonFillPoints.push({ x: pointer.x, y: pointer.y });

              fillShape = new fabric.Polygon(polygonFillPoints, {
                fill: "yellow",
                opacity: 0.2,
                selectable: false,
                evented: false,
              });
              canvas.add(fillShape);

              canvas.renderAll();
            }
          }
        });

        canvas.on("mouse:down", function (event) {
          let pointer = canvas.getPointer(event.e);

          if (
            event.target &&
            event.target.type === "circle" &&
            isCreatingPolygon
          ) {
            drawPolygon(tmpPolygonPoints);
            isCreatingPolygon = false;
            canvas.selection = true;
            tmpPolygonPoints = [];
          } else if (isCreatingPolygon) {
            let circle = new fabric.Circle({
              radius: 4,
              fill: "white",
              stroke: "black",
              strokeWidth: 1,
              left: pointer.x,
              top: pointer.y,
              selectable: false,
              hasControls: false,
              hasBorders: false,
              originX: "center",
              originY: "center",
              strokeUniform: true,
              cornerSize: 6,
            });

            if (tmpPolygonPoints.length > 0) {
              let prevPoint = tmpPolygonPoints[tmpPolygonPoints.length - 1];
              line = new fabric.Line(
                [prevPoint.x, prevPoint.y, pointer.x, pointer.y],
                {
                  stroke: "black",
                  strokeWidth: 2,
                  selectable: false,
                  evented: false,
                }
              );
              canvas.add(line);
            }
            tmpPolygonPoints.push({ x: pointer.x, y: pointer.y });
            canvas.add(circle);

            // Create fill shape using the polygonPoints array
            if (tmpPolygonPoints.length > 1) {
              if (fillShape) {
                canvas.remove(fillShape);
              }

              fillShape = new fabric.Polygon(tmpPolygonPoints, {
                fill: "yellow", // Fill color
                opacity: 0.2, // Opacity
                selectable: false,
                evented: false,
              });
              canvas.add(fillShape);
            }
          }
        });
      }
    }

    //Drawing Polygon
    function drawPolygon(polyPoints) {
      tool = "poly";
      isEditing = false;
      var polygon = new fabric.Polygon(polyPoints, {
        id: "poly_count_" + (annotations.length + 1),
        fill: "#c7c5c54f",
        stroke: "black",
        strokeWidth: 1,
        objectCaching: false,
        transparentCorners: false,
        cornerColor: "yellow",
        strokeUniform: true,
        cornerSize: 6,
        selectable: false,
      });

      polygonObject = polygon;

      // Remove the previous circles used to create the polygon
      canvas.getObjects().forEach((obj) => {
        if (obj.type === "circle") {
          canvas.remove(obj);
        }
      });

      canvas.getObjects().forEach((obj) => {
        if (obj.type === "polygon" && obj.stroke === "transparent") {
          canvas.remove(obj);
        }
      });

      canvas.getObjects().forEach((obj) => {
        if (obj.type === "line") {
          canvas.remove(obj);
        }
      });

      canvas.add(polygon);
      canvas.renderAll();
      canvas.setActiveObject(polygon);
      Edit(polygon);
      setShowAnnotationEditor(true);
      setSelectedLabel("");
      //document.querySelector(".annotation-editor").style.display = "block";
      // const selectElement = document.getElementById("labels");
      // selectElement.value = "";
    }

    function polygonPositionHandler(tmpPolygonObject, pointIndex) {
      var x =
          tmpPolygonObject.points[pointIndex].x - tmpPolygonObject.pathOffset.x,
        y =
          tmpPolygonObject.points[pointIndex].y - tmpPolygonObject.pathOffset.y;

      return fabric.util.transformPoint(
        { x: x, y: y },
        fabric.util.multiplyTransformMatrices(
          tmpPolygonObject.canvas.viewportTransform,
          tmpPolygonObject.calcTransformMatrix()
        )
      );
    }

    function getObjectSizeWithStroke(object) {
      var stroke = new fabric.Point(
        object.strokeUniform ? 1 / object.scaleX : 1,
        object.strokeUniform ? 1 / object.scaleY : 1
      ).multiply(object.strokeWidth);

      return new fabric.Point(
        object.width + stroke.x,
        object.height + stroke.y
      );
    }

    function actionHandler(eventData, transform, x, y) {
      var polygon = transform.target,
        currentControl = polygon.controls[polygon.__corner],
        mouseLocalPosition = polygon.toLocalPoint(
          new fabric.Point(x, y),
          "center",
          "center"
        ),
        polygonBaseSize = getObjectSizeWithStroke(polygon),
        size = polygon._getTransformedDimensions(0, 0),
        finalPointPosition = {
          x:
            (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
            polygon.pathOffset.x,
          y:
            (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
            polygon.pathOffset.y,
        };

      polygon.points[currentControl.pointIndex] = finalPointPosition;
      return true;
    }

    function anchorWrapper(anchorIndex, fn) {
      return function (eventData, transform, x, y) {
        var tmpfabricObject = transform.target,
          absolutePoint = fabric.util.transformPoint(
            {
              x:
                tmpfabricObject.points[anchorIndex].x -
                tmpfabricObject.pathOffset.x,
              y:
                tmpfabricObject.points[anchorIndex].y -
                tmpfabricObject.pathOffset.y,
            },
            tmpfabricObject.calcTransformMatrix()
          ),
          actionPerformed = fn.call(this, eventData, transform, x, y),
          newDim = tmpfabricObject._setPositionDimensions({}),
          polygonBaseSize = getObjectSizeWithStroke(tmpfabricObject),
          newX =
            (tmpfabricObject.points[anchorIndex].x -
              tmpfabricObject.pathOffset.x) /
            polygonBaseSize.x,
          newY =
            (tmpfabricObject.points[anchorIndex].y -
              tmpfabricObject.pathOffset.y) /
            polygonBaseSize.y;

        tmpfabricObject.setPositionByOrigin(
          absolutePoint,
          newX + 0.5,
          newY + 0.5
        );
        return actionPerformed;
      };
    }

    function Edit() {
      var activeObject = canvas.getActiveObject();

      if (activeObject && activeObject.type === "polygon") {
        activeObject.edit = !activeObject.edit;

        if (activeObject.edit) {
          var lastControl = activeObject.points.length - 1;
          activeObject.cornerStyle = "circle";
          activeObject.cornerColor = "green";
          activeObject.cornerSize = 12;
          activeObject.controls = activeObject.points.reduce(function (
            acc,
            point,
            index
          ) {
            var control = new fabric.Control({
              positionHandler: function (dim, finalMatrix, fabricObject) {
                return polygonPositionHandler(activeObject, index);
              },
              actionHandler: anchorWrapper(
                index > 0 ? index - 1 : lastControl,
                actionHandler
              ),
              actionName: "modifyPolygon",
            });

            // Ensure that pointIndex is set on the control
            control.pointIndex = index;

            acc["p" + index] = control;
            return acc;
          },
          {});
          //document.querySelector(".annotation-editor").style.display = "block";
        } else {
          activeObject.cornerColor = "yellow";
          activeObject.cornerStyle = "circle";
          activeObject.controls = fabric.Object.prototype.controls;
        }
        activeObject.hasBorders = !activeObject.edit;
        canvas.requestRenderAll();
      } else {
        console.log("No polygon selected or active.");
      }

      //document.querySelector(".annotation-editor").style.display = "none";
    }

    //#region Zoom In
    const zoomIn = () => {
      canvas.defaultCursor = "zoom-in";
      let newZoom = canvas.getZoom() * 1.1;
      if (newZoom <= 2.0) {
        canvas.zoomToPoint(
          new fabric.Point(canvas.width / 2, canvas.height / 2),
          newZoom
        );
      }
    };
    //#endregion

    //#region Zoom Out
    const zoomOut = () => {
      canvas.defaultCursor = "zoom-out";
      let newZoom = canvas.getZoom() / 1.1;
      if (newZoom >= 1) {
        canvas.zoomToPoint(
          new fabric.Point(canvas.width / 2, canvas.height / 2),
          newZoom
        );

        if (newZoom === 1) {
          resetZoom();
        }
      }
    };
    //#endregion

    //#region Panning
    const enablePanning = () => {
      isPanning = true;
      isDrawing = false;
      tool = "select";
      canvas.selection = false;
      canvas.defaultCursor = "grabbing";
    };
    //#endregion

    //#region Handle Select Tool
    const handleSelectTool = () => {
      tool = "select";
      isDrawing = false;
      canvas.selection = false;
      canvas.defaultCursor = "default";
      canvas.discardActiveObject();
      canvas.renderAll();
    };
    //#endregion

    //#region Reset Image after ZoomOut
    const resetZoom = () => {
      if (originalImage) {
        let canvasWidth = canvas.width;
        let canvasHeight = canvas.height;

        let imgWidth = originalImage.width * originalImage.scaleX;
        let imgHeight = originalImage.height * originalImage.scaleY;

        let bgLeft = (canvasWidth - imgWidth) / 2;
        let bgTop = (canvasHeight - imgHeight) / 2;

        // Adjust background image position based on panning
        bgLeft -= canvas.viewportTransform[1];
        bgTop -= canvas.viewportTransform[1];

        originalImage.set({
          left: bgLeft,
          top: bgTop,
        });

        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); // Reset viewport transform
        canvas.requestRenderAll();
      }
    };
    //#endregion

    const saveAnnotation = () => {
      const selectedLabel = document.getElementById("annotationLabel").value;
      if (!selectedLabel) {
        alert("Select Label");
        return;
      }

      var activeObject = canvas.getActiveObject();

      const selectedLabelInfo = labels.find(
        (obj) => obj.label === selectedLabel
      );

      if (selectedLabelInfo && activeObject) {
        activeObject.set("fill", selectedLabelInfo.color);
        canvas.renderAll();
      }

      if (tool === "rect") {
        let editableId = annotations.find((obj) => obj.id === selectedtoolId);

        if (editableId) {
          editableId = editableId.id;
          const modifiedRectPoints = [
            { x: rect.left, y: rect.top },
            { x: rect.left + rect.width, y: rect.top },
            {
              x: rect.left + rect.width,
              y: rect.top + rect.height,
            },
            { x: rect.left, y: rect.top + rect.height },
          ];

          // const listItem = document.getElementById(this.selectedtoolId);
          // if (listItem) {
          //   listItem.innerHTML = selectedOption;
          //   listItem.style.backgroundColor = selectedLabelInfo.color;
          // }

          let editedIndex = annotations.findIndex(
            (obj) => obj.id === editableId
          );

          annotations[editedIndex].label = selectedLabel;
          annotations[editedIndex].rectanglePoints = modifiedRectPoints;

          labelsAdded[editedIndex].label = selectedLabel;
          labelsAdded[editedIndex].color = selectedLabelInfo.color;

          setAddedLabelsList(labelsAdded);
          isEditing = false;
          setShowAnnotationEditor(false);
        } else {
          const newObj = {
            id: rect.id,
            label: selectedLabel,
            rectanglePoints: rectPoints,
          };

          annotations.push(newObj);

          const newLabel = {
            id: newObj.id,
            label: selectedLabel,
            color: selectedLabelInfo.color,
          };

          labelsAdded = [...labelsAdded, newLabel];
          setAddedLabelsList(labelsAdded);

          setShowAnnotationEditor(false);
          // const ul = document.getElementById("selectedItems");
          // const li = document.createElement("li");
          // li.textContent = selectedOption;
          // li.id = newObj.id;
          // li.style.backgroundColor = selectedLabelInfo.color;
          // li.setAttribute("onclick", `editor.selectAnnotation(${newObj.id})`);
          // ul.appendChild(li);
        }

        // document.querySelector(".annotation-editor").style.display = "none";
      } else if (tool === "poly") {
        // editor.addPolygon();
        let editableId = annotations.find((obj) => obj.id === selectedtoolId);

        if (editableId) {
          editableId = editableId.id;
          const modifiedPolyPoints = [];
          let objectLeft = polygonObject.left;
          let objectTop = polygonObject.top;

          polygonObject.points.forEach(function (point) {
            // Calculate the updated points based on the object's position
            modifiedPolyPoints.push({
              x: point.x + objectLeft,
              y: point.y + objectTop,
            });
          });

          // const listItem = document.getElementById(this.selectedtoolId);
          // if (listItem) {
          //   listItem.innerHTML = selectedLabel;
          //   listItem.style.backgroundColor = selectedLabelInfo.color;
          // }

          let editedIndex = annotations.findIndex(
            (obj) => obj.id === editableId
          );
          annotations[editedIndex].label = selectedLabel;
          annotations[editedIndex].polygonPoints = modifiedPolyPoints;
          isEditing = false;

          labelsAdded[editedIndex].label = selectedLabel;
          labelsAdded[editedIndex].color = selectedLabelInfo.color;

          setAddedLabelsList(labelsAdded);

          setShowAnnotationEditor(false);
        } else {
          const newObj = {
            id: polygonObject.id,
            label: selectedLabel,
            polygonPoints: polygonObject.points,
          };

          annotations.push(newObj);

          const newLabel = {
            id: newObj.id,
            label: selectedLabel,
            color: selectedLabelInfo.color,
          };

          labelsAdded = [...labelsAdded, newLabel];
          setAddedLabelsList(labelsAdded);
          setShowAnnotationEditor(false);
        }
      }
      canvas.discardActiveObject();
      canvas.renderAll();
    };

    //Delete Annotation
    const deleteAnnotation = () => {
      if (selectedtoolId) {
        const indexToDelete = annotations.findIndex(
          (obj) => obj.id === selectedtoolId
        );
        if (indexToDelete !== -1) {
          annotations.splice(indexToDelete, 1);
          const listItem = document.getElementById(selectedtoolId);
          listItem.remove();
        }
        selectedtoolId = null;
      }
      canvas.remove(canvas.getActiveObject());
      setShowAnnotationEditor(false);
    };

    const selectAnnotationOnClick = (event) => {
      if (event.target.tagName === "LI") {
        selectedtoolId = event.target.id;

        let selectedLabelArray = annotations.find(
          (obj) => obj.id === selectedtoolId
        );

        let labelIndex = annotations.findIndex(
          (obj) => obj.id === selectedtoolId
        );

        const selectElement = document.getElementById("annotationLabel");
        selectElement.value = selectedLabelArray.label;
        // liElements.forEach((li, index) => {
        //   li.classList.remove("selectedLabel");
        // });

        const fabricObject = canvas.item(labelIndex);
        if (fabricObject) {
          canvas.setActiveObject(fabricObject);
          canvas.requestRenderAll();
        }

        //selectedLabel.className = "selectedLabel";
        isEditing = true;
        setShowAnnotationEditor(true);
      }
    };

    // const selectanno = document.querySelector("#selectedItems li");
    // selectanno.addEventListener("click", selectAnnotationOnClick);

    document.addEventListener("mousemove", trackMouse);
    document.addEventListener("click", selectAnnotationOnClick);

    // Function to track mouse pointer
    function trackMouse(e) {
      var rect = canvas.getElement().getBoundingClientRect();
      var mouseX = e.clientX - rect.left;
      var mouseY = e.clientY - rect.top;

      if (
        mouseX < 0 ||
        mouseY < 0 ||
        mouseX > rect.width ||
        mouseY > rect.height
      ) {
        // Mouse pointer is outside the canvas
        document.querySelector("#crosshair-h").style.display = "none";
        document.querySelector("#crosshair-v").style.display = "none";
      } else {
        if (tool === "poly" || tool === "rect") {
          document.querySelector("#crosshair-h").style.display = "block";
          document.querySelector("#crosshair-v").style.display = "block";
        }
      }
    }

    const handleKeyDown = (event) => {
      if (event.keyCode === 27) {
        tool = "poly";
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const button = document.getElementById("addRectangle");
    button.addEventListener("click", handleRectangleTool);

    const polygon = document.getElementById("addPolygon");
    polygon.addEventListener("click", addPolygon);

    const ZoomIn = document.getElementById("zoomIn");
    ZoomIn.addEventListener("click", zoomIn);

    const ZoomOut = document.getElementById("zoomOut");
    ZoomOut.addEventListener("click", zoomOut);

    const pan = document.getElementById("pan");
    pan.addEventListener("click", enablePanning);

    const select = document.getElementById("select");
    select.addEventListener("click", handleSelectTool);

    const reset = document.getElementById("reset");
    reset.addEventListener("click", resetZoom);

    const save = document.getElementById("save");
    save.addEventListener("click", saveAnnotation);

    // const selectanno = document.querySelector("#selectedItems li");
    // selectanno.addEventListener("click", selectAnnotationonclick);

    // Attach event listener to all li elements
    const liElements = document.querySelectorAll("li");
    liElements.forEach((li) => {
      li.addEventListener("click", handleClick);
    });

    const deleteAnnotationblk = document.getElementById("deleteAnnotation");
    deleteAnnotationblk.addEventListener("click", deleteAnnotation);

    // Cleanup on unmount
    return () => {
      //canvas.dispose();
      window.removeEventListener("keydown", handleKeyDown);

      liElements.forEach((li) => {
        li.removeEventListener("click", handleClick);
      });
    };
  }, []);

  const handleLableChange = (event) => {
    setSelectedLabel(event.target.value);
  };

  useEffect(() => {
    // Setup our variables
    let cH = document.getElementById("crosshair-h");
    let cV = document.getElementById("crosshair-v");
    let canvas = document.getElementById("canvas");
    let canvasOffset = getOffset(canvas);
    let canvasWidth = canvas.offsetWidth;
    let canvasHeight = canvas.offsetHeight;

    function getOffset(el) {
      var rect = el.getBoundingClientRect();
      return {
        left: rect.left + window.pageXOffset,
        top: rect.top + window.pageYOffset,
      };
    }

    function updateCrosshairPosition(e) {
      var x = e.pageX - canvasOffset.left;
      var y = e.pageY - canvasOffset.top;

      // Ensure crosshair stays within canvas boundaries
      if (x >= 0 && x <= canvasWidth) {
        cV.style.left = e.pageX + "px";
      }
      if (y >= 0 && y <= canvasHeight) {
        cH.style.top = e.pageY + "px";
      }
      e.stopPropagation();
    }

    document.addEventListener("mousemove", updateCrosshairPosition);
    document.addEventListener("touchmove", updateCrosshairPosition);

    // Cleanup
    return () => {
      document.removeEventListener("mousemove", updateCrosshairPosition);
      document.removeEventListener("touchmove", updateCrosshairPosition);
    };
  }, []);

  // const [activeButton, setActiveButton] = useState(null);

  // const handleClick = (buttonId) => {
  //   setActiveButton(buttonId === activeButton ? null : buttonId);
  // };

  const [tool, setTool] = useState(null);

  const handleClick = (selectedTool) => {
    setTool(selectedTool);
  };

  return (
    <div className="App">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div className="controls">
            <button
              id="select"
              className={tool === "select" ? "active" : null}
              onClick={() => handleClick("select")}
            >
              <img src={select} alt="select" />
            </button>
            <button
              id="addRectangle"
              className={tool === "rect" ? "active" : ""}
              onClick={() => handleClick("rect")}
            >
              <img src={rectangleIcon} alt="rect" />
            </button>
            <button
              id="addPolygon"
              className={tool === "poly" ? "active" : ""}
              onClick={() => handleClick("poly")}
            >
              <img src={polygonIcon} alt="polygon" />
            </button>
            <button
              id="pan"
              // className={activeButton === "pan" ? "active" : ""}
              // onClick={() => handleClick("pan")}
            >
              <img src={pan} alt="pan" />
            </button>
            <button
              id="zoomIn"
              // className={activeButton === "zoomIn" ? "active" : ""}
              // onClick={() => handleClick("zoomIn")}
            >
              <img src={zoomInIcon} alt="zoom in" />
            </button>
            <button
              id="zoomOut"
              // className={activeButton === "zoomOut" ? "active" : ""}
              // onClick={() => handleClick("zoomOut")}
            >
              <img src={zoomOutIcon} alt="zoomout" />
            </button>
            <button
              id="reset"
              // className={activeButton === "reset" ? "active" : ""}
              // onClick={() => handleClick("reset")}
            >
              <img src={reset} alt="reset" />
            </button>
          </div>
          <div className="crosshair-div">
            <div id="crosshair-h" className="hair"></div>
            <div id="crosshair-v" className="hair"></div>
            <canvas id="canvas" width="800" height="500"></canvas>
          </div>
        </div>
        <div
          className="annotation-editor"
          style={{ display: !showAnnotationEditor ? "none" : "" }}
        >
          <h2>Annotation Editor</h2>
          <select
            name="labels"
            id="annotationLabel"
            value={selectedLabel}
            onChange={handleLableChange}
          >
            <option key="" value="" disabled>
              Select Label
            </option>
            {labels.map((obj) => {
              return (
                <option key={obj.label} value={obj.label}>
                  {obj.label}
                </option>
              );
            })}
          </select>
          <br />
          <br />
          <div className="submit">
            <button className="save" id="save">
              Save
            </button>
            <button
              id="deleteAnnotation"
              // onClick={deleteAnnotation}
              className="delete"
            >
              delete
            </button>
          </div>
        </div>
        <div style={{ position: "absolute", top: "50px", right: "10px" }}>
          <ul id="selectedItems">
            {addedLabelsList.map((item) => {
              return (
                <li
                  id={item.id}
                  key={item.id}
                  //onClick={selectAnnotationOnClick}
                  style={{ backgroundColor: item.color }}
                >
                  {item.label}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
