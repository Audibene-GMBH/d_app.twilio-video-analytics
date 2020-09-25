var AnimationEngine = {
    _animationQueue: [],
    _preparationQueue: [],
    _isAnimateBusy: false,

    _animate: function() {
        this._isAnimateBusy = true;
        this._animationQueue.forEach(({ context, action, args}) => {
            action.bind(context)(...args);
        });
        this._animationQueue = this._preparationQueue;
        this._preparationQueue = [];
        this._isAnimateBusy = false;

        if (this._animationQueue.length > 0) requestAnimationFrame(this._animate.bind(this));
    },

    addToQueue: function(context, action, ...args) {
        this._preparationQueue.push({
            context: context,
            action: action,
            args: [...args]
        });
        if (!this._isAnimateBusy) this._animate();
    }
};

module.exports = AnimationEngine;