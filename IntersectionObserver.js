// https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API

IntersectionObserver = function (callback, options) {

    this.callback = callback;

    this.viewport = {};
    this.secondaryViewport = {};

    //default options
    let defaults = {
        root: window,               // todo check if this is not supposed to be document.
        secondScrollArea: false,
        rootMargin: '0px',
        threshold: 0,

        // the next options are not part of the original API, but we noticed that we needed this to make sure
        // this feature behaved correctly using widgets, like carrousels

        additionTriggerEvent: false,        // example: 'scroll'
        additionTriggerEventObject: false,  // example: the Flickity object
        additionTriggerEventMethod: false,  // example: 'on' or 'addEventListener'

        blockingTime: 10                    // block event handling for 10 milliseconds
    };
    this.options = Object.assign({}, defaults, options);

    this.elements = [];

    // we need self for referencing this object in the next function
    let self = this;
    // block next few events for 10 milliseconds
    this.eventBlocked = false;
    let eventResponse = function(){
        if (!self.eventBlocked) {
            self.eventBlocked = true;
            setTimeout(function (self) {
                self.eventBlocked = false;
            }, self.options.blockingTime, self);
            self.check();
        }
    };

    // trigger the event response on scroll event
    this.options.root.addEventListener('scroll', eventResponse);

    // iff there is a secondScrollArea, listen to scroll events in that one as well.
    if (this.options.secondScrollArea)
        this.options.secondScrollArea.addEventListener('scroll', eventResponse);

    // trigger the event response on resize action
    window.addEventListener('resize', eventResponse);

    if (this.options.additionTriggerEventObject) {
        this.options.additionTriggerEventObject[this.options.additionTriggerEventMethod](this.options.additionTriggerEvent, eventResponse);
    }
};

IntersectionObserver.prototype.observe = function (elem) {
    // check is the element is not already being observed, no need to run twice on one event and element
    if (this.elements.indexOf(elem) < 0){
        this.elements.push(elem);

        // run for the first time, to make sure that is fires, if element is in viewport
        this.check(elem);
    }
};

IntersectionObserver.prototype.unobserve = function (elem) {
    if (this.elements.indexOf(elem) > -1){
        this.elements.splice(this.elements.indexOf(elem), 1);
    }
};

IntersectionObserver.prototype.disconnect = function () {
    this.elements = [];

    // todo perhaps clean up event listeners?
};

IntersectionObserver.prototype.takeRecords = function (elem) {
    // todo implement
    console.log('[todo] takeRecords: ' + elem);
};

IntersectionObserver.prototype.calculateRatio = function (viewport, rect) {

    //determine the coordinates of the intersection
    let left    = Math.max(viewport.viewportX, rect.left);
    let right   = Math.min(viewport.viewportX + viewport.viewportW, rect.left + rect.width);
    let bottom  = Math.max(viewport.viewportY, rect.top);
    let top     = Math.min(viewport.viewportY + viewport.viewportH, rect.top + rect.height);

    // determine dimensions of the intersection
    let intersectionWidth = Math.max(0, right - left);
    let intersectionHeight = Math.max(0, top - bottom);

    //calculate the area of the element
    let elementArea = rect.width * rect.height;

    //calculate the area of the intersection
    let intersectionArea = intersectionWidth * intersectionHeight;

    // make sure the ratio is non-negative,
    // negative value means no intersection
    return Math.max(0, intersectionArea / elementArea);
};

IntersectionObserver.prototype.check = function (elem) {
    // no elements, no action...
    if (this.elements.length > 0) {

        // update viewport settings
        // todo handle root != window (or document)
        this.viewport.viewportX = 0;
        this.viewport.viewportY = 0;
        this.viewport.viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        this.viewport.viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        // update secondary viewport settings
        if (this.options.secondScrollArea) {
            let rectViewport = this.options.secondScrollArea.getBoundingClientRect();
            this.secondaryViewport.viewportX = rectViewport.left;
            this.secondaryViewport.viewportY = rectViewport.top;
            this.secondaryViewport.viewportW = rectViewport.width;
            this.secondaryViewport.viewportH = rectViewport.height;
        }

        let entries = [];
        this.elements.forEach((element) => {
            if (typeof elem !== 'undefined'
                && elem !== element) {
                //do nothing
            } else {
                let rect = element.getBoundingClientRect();

                // first check is the element in in the browser viewport
                let intersectionRatio = this.calculateRatio(this.viewport, rect);

                if (this.options.secondScrollArea) {

                    // there is a second area, for example if items are hidden in case of carrousel
                    // check is the items are in the secondary viewport...
                    // this is relative to the selected area, so we need first to check the actual viewport.
                    if (intersectionRatio > 0) {
                        intersectionRatio = this.calculateRatio(this.secondaryViewport, rect);
                    }
                }

                if (intersectionRatio > 0) {
                    entries.push({
                        boundingClientRect: rect,
                        intersectionRatio: intersectionRatio,
                        // intersectionRect: null,
                        isIntersecting: true,
                        // rootBounds: null,
                        target: element
                        // time: 0,
                    });
                }
            }
        });

        if (entries.length > 0) {
            this.callback(entries, this);
        }
    }

};