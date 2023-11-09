window.onload = function () {
    touchfree.init();
    var plugins = [new SnappingPlugin.SnappingPlugin()];

    touchfree.internal.InputActionManager.setPlugins(plugins);

    touchfree.internal.InputActionManager.plugins[0].setSnapModeToMagnet();
    touchfree.internal.InputActionManager.plugins[0].setSnapDistance(25);
    touchfree.internal.InputActionManager.plugins[0].setSnapSoftness(0.3);
};
