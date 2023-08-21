window.onload = function () {
    touchfree.init();
    var plugins = [new SnappingPlugin.SnappingPlugin()];

    touchfree.InputActionManager.setPlugins(plugins);

    touchfree.InputActionManager.plugins[0].setSnapModeToMagnet();
    touchfree.InputActionManager.plugins[0].setSnapDistance(25);
    touchfree.InputActionManager.plugins[0].setSnapSoftness(0.3);
};
