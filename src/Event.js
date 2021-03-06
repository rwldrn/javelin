/**
 * @requires javelin-install
 * @provides javelin-event
 * @javelin
 */

/**
 * A generic event, routed by @{JX.Stratcom}. All events within Javelin are
 * represented by a {@JX.Event}, regardless of whether they originate from
 * a native DOM event (like a mouse click) or are custom application events.
 *
 * Events have a propagation model similar to native Javascript events, in that
 * they can be stopped with stop() (which stops them from continuing to
 * propagate to other handlers) or prevented with prevent() (which prevents them
 * from taking their default action, like following a link). You can do both at
 * once with kill().
 *
 * @author epriestley
 * @task stop Stopping Event Behaviors
 * @task info Getting Event Information
 */
JX.install('Event', {
  members : {

    /**
     * Stop an event from continuing to propagate. No other handler will
     * receive this event, but its default behavior will still occur. See
     * ""Using Events"" for more information on the distinction between
     * 'stopping' and 'preventing' an event. See also prevent() (which prevents
     * an event but does not stop it) and kill() (which stops and prevents an
     * event).
     *
     * @return this
     * @task stop
     */
    stop : function() {
      var r = this.getRawEvent();
      if (r) {
        r.cancelBubble = true;
        r.stopPropagation && r.stopPropagation();
      }
      this.setStopped(true);
      return this;
    },


    /**
     * Prevent an event's default action. This depends on the event type, but
     * the common default actions are following links, submitting forms,
     * and typing text. Event prevention is generally used when you have a link
     * or form which work properly without Javascript but have a specialized
     * Javascript behavior. When you intercept the event and make the behavior
     * occur, you prevent it to keep the browser from following the link.
     *
     * Preventing an event does not stop it from propagating, so other handlers
     * will still receive it. See ""Using Events"" for more information on the
     * distinction between 'stopping' and 'preventing' an event. See also
     * stop() (which stops an event but does not prevent it) and kill()
     * (which stops and prevents an event).
     *
     * @return this
     * @task stop
     */
    prevent : function() {
      var r = this.getRawEvent();
      if (r) {
        r.returnValue = false;
        r.preventDefault && r.preventDefault();
      }
      this.setPrevented(true);
      return this;
    },


    /**
     * Stop and prevent an event, which stops it from propagating and prevents
     * its defualt behavior. This is a convenience function, see stop() and
     * prevent() for information on what it means to stop or prevent an event.
     *
     * @return this
     * @task stop
     */
    kill : function() {
      this.prevent();
      this.stop();
      return this;
    },


    /**
     * Get the special key (like tab or return), if any,  associated with this
     * event. Browsers report special keys differently;  this method allows you
     * to identify a keypress in a browser-agnostic way. Note that this detects
     * only some special keys: delete, tab, return escape, left, up, right,
     * down.
     *
     * For example, if you want to react to the escape key being pressed, you
     * could install a listener like this:
     *
     *  JX.Stratcom.listen(
     *    'keydown',
     *    'example',
     *    function (e) {
     *      if (e.getSpecialKey() == 'esc') {
     *        JX.log("You pressed 'Escape'! Well done! Bravo!");
     *      }
     *    });
     *
     *
     * @return string|null ##null## if there is no associated special key,
     *                     or one of the strings 'delete', 'tab', 'return',
     *                     'esc', 'left', 'up', 'right', or 'down'.
     * @task info
     */
    getSpecialKey : function() {
      var r = this.getRawEvent();
      if (!r || r.shiftKey) {
        return null;
      }

      var c = r.keyCode;
      do {
        c = JX.Event._keymap[c] || null;
      } while (c && JX.Event._keymap[c])

      return c;
    }
  },

  statics : {
    _keymap : {
      8     : 'delete',
      9     : 'tab',
      13    : 'return',
      27    : 'esc',
      37    : 'left',
      38    : 'up',
      39    : 'right',
      40    : 'down',
      63232 : 38,
      63233 : 40,
      62234 : 37,
      62235 : 39
    }
  },

  properties : {

    /**
     * Native Javascript event which generated this @{JX.Event}. Not every
     * event is generated by a native event, so there may be ##null## in
     * this field.
     *
     * @type Event|null
     * @task info
     */
    rawEvent : null,

    /**
     * String describing the event type, like 'click' or 'mousedown'. This
     * may also be an application or object event.
     *
     * @type string
     * @task info
     */
    type : null,

    /**
     * If available, the DOM node where this event occurred. For example, if
     * this event is a click on a button, the target will be the button which
     * was clicked. Application events will not have a target, so this property
     * will return the value ##null##.
     *
     * @type DOMNode|null
     * @task info
     */
    target : null,

    /**
     * Metadata attached to nodes associated with this event.
     *
     * For native events, the DOM is walked from the event target to the root
     * element. Each sigil which is encountered while walking up the tree is
     * added to the map as a key. If the node has associated metainformation,
     * it is set as the value; otherwise, the value is null.
     *
     * @type dict<string, *>
     * @task info
     */
    data : null,

    /**
     * Sigil path this event was activated from. TODO: explain this
     *
     * @type list<string>
     * @task info
     */
    path : [],

    /**
     * True if propagation of the event has been stopped. See stop().
     *
     * @type bool
     * @task stop
     */
    stopped : false,

    /**
     * True if default behavior of the event has been prevented. See prevent().
     *
     * @type bool
     * @task stop
     */
    prevented : false,

    /**
     * @task info
     */
    nodes : {}
  },

  /**
   * @{JX.Event} installs a toString() method in ##__DEV__## which allows you to
   * log or print events and get a reasonable representation of them:
   *
   *  Event<'click', ['path', 'stuff'], [object HTMLDivElement]>
   */
  initialize : function() {
    if (__DEV__) {
      JX.Event.prototype.toString = function() {
        var path = '['+this.getPath().join(', ')+']';
        return 'Event<'+this.getType()+', '+path+', '+this.getTarget()+'>';
      }
    }
  }
});





