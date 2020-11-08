export var ThemeColors;
(function (ThemeColors) {
    ThemeColors.ClipColors = [
        ["rgb(86, 227, 198)", "#000000"],
        ["#efefef", "#000000"],
        ["rgb(252, 186, 3)", "#000000"],
        ["rgb(84, 255, 130)", "#000000"]
    ];
    function randomClipColor() {
        return ThemeColors.ClipColors[Math.floor(ThemeColors.ClipColors.length * Math.random())];
    }
    ThemeColors.randomClipColor = randomClipColor;
})(ThemeColors || (ThemeColors = {}));