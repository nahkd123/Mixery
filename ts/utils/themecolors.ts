export namespace ThemeColors {
    export const ClipColors = [
        ["rgb(86, 227, 198)",           "#000000"],
        ["#efefef",                     "#000000"],
        ["rgb(252, 186, 3)",            "#000000"],
        ["rgb(84, 255, 130)",           "#000000"]
    ];

    export function randomClipColor() {
        return ClipColors[Math.floor(ClipColors.length * Math.random())];
    }
}