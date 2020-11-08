export var AutomationsUIUtils;
(function (AutomationsUIUtils) {
    function drawGrid(ctx, startX = 0, endX = ctx.canvas.width, pxSegments = 100) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        for (let x = startX; x <= endX; x += pxSegments) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.closePath();
        }
        for (let y = 0; y <= height; y += height / 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.closePath();
        }
    }
    AutomationsUIUtils.drawGrid = drawGrid;
})(AutomationsUIUtils || (AutomationsUIUtils = {}));