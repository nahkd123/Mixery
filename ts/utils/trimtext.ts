export function trimText(str: string, ctx: CanvasRenderingContext2D, width: number) {
    let renderWidth = ctx.measureText(str).width;
    if (renderWidth <= width) return str;

    while (ctx.measureText(str + "...").width > width) {
        str = str.substr(0, str.length - 1);
        if (str.length === 0) return ".";
    }
    return str + "...";
}