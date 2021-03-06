/**
 * @requires javelin-install
 *           javelin-stratcom
 *           javelin-util
 *           javelin-behavior
 * @provides javelin-request
 * @javelin
 */

/**
 * Make basic AJAX XMLHTTPRequests.
 */
JX.install('Request', {
  construct : function(uri, handler) {
    this.setURI(uri);
    if (handler) {
      this.listen('done', handler);
    }
  },

  events : ['done', 'error', 'finally'],

  members : {

    _xhrkey : null,
    _transport : null,
    _finished : false,

    send : function() {
      var xport = null;

      try {
        try {
          xport = new XMLHttpRequest();
        } catch (x) {
          xport = new ActiveXObject("Msxml2.XMLHTTP");
        }
      } catch (x) {
        xport = new ActiveXObject("Microsoft.XMLHTTP");
      }

      this._transport = xport;
      this._xhrkey = JX.Request._xhr.length;
      JX.Request._xhr.push(this);

      xport.onreadystatechange = JX.bind(this, this._onreadystatechange);

      var q = [];
      var data = this.getData() || {};
      data.__async__ = true;
      for (var k in data) {
        q.push(encodeURIComponent(k)+'='+encodeURIComponent(data[k]));
      }
      q = q.join('&');

      var uri = this.getURI();
      var method = this.getMethod().toUpperCase();

      if (method == 'GET') {
        uri += ((uri.indexOf('?') === -1) ? '?' : '&') + q;
      }

      if (this.getTimeout()) {
        this._timer = JX.defer(
          JX.bind(
            this,
            this._fail,
            JX.Request.ERROR_TIMEOUT),
          this.getTimeout());
      }

      xport.open(method, uri, true);

      if (method == 'POST') {
        xport.setRequestHeader(
          'Content-Type',
          'application/x-www-form-urlencoded');
        xport.send(q);
      } else {
        xport.send(null);
      }
    },

    abort : function() {
      this._cleanup();
    },

    _onreadystatechange : function() {
      var xport = this._transport;
      try {
        if (this._finished) {
          return;
        }
        if (xport.readyState != 4) {
          return;
        }
        if (xport.status < 200 || xport.status >= 300) {
          this._fail();
          return;
        }

        if (__DEV__) {
          if (!xport.responseText.length) {
            throw new Error(
              'JX.Request("'+this.getURI()+'", ...): '+
              'server returned an empty response.');
          }
          if (xport.responseText.indexOf('for (;;);') != 0) {
            throw new Error(
              'JX.Request("'+this.getURI()+'", ...): '+
              'server returned an invalid response.');
          }
        }

        var text = xport.responseText.substring('for (;;);'.length);
        var response = eval('('+text+')');
      } catch (exception) {

        if (__DEV__) {
          JX.log(
            'JX.Request("'+this.getURI()+'", ...): '+
            'caught exception processing response: '+exception);
        }
        this._fail();
        return;
      }

      try {
        if (response.error) {
          this._fail(response.error);
        } else {
          JX.Stratcom.mergeData(response.javelin_metadata || {});
          this._done(response);
          JX.initBehaviors(response.javelin_behaviors || {});
        }
      } catch (exception) {
        //  In Firefox+Firebug, at least, something eats these. :/
        JX.defer(function() {
          throw exception;
        });
      }
    },

    _fail : function(error) {
      this._cleanup();

      this.invoke('error', error);
      this.invoke('finally');
    },

    _done : function(response) {
      this._cleanup();

      if (response.onload) {
        for (var ii = 0; ii < response.onload.length; ii++) {
          (new Function(response.onload[ii]))();
        }
      }

      this.invoke('done', this.getRaw() ? response : response.payload);
      this.invoke('finally');
    },

    _cleanup : function() {
      this._finished = true;
      delete JX.Request._xhr[this._xhrkey];
      this._timer && this._timer.stop();
      this._transport.abort();
    }

  },

  statics : {
    _xhr : [],
    shutdown : function() {
      for (var ii = 0; ii < JX.Request._xhr.length; ii++) {
        try {
          JX.Request._xhr[ii] && JX.Request._xhr[ii].abort();
        } catch (x) {
          // Ignore.
        }
      }
      JX.Request._xhr = [];
    },
    ERROR_TIMEOUT : -9000
  },

  properties : {
    URI : null,
    data : null,

    /**
     * Configure which HTTP method to use for the request. Permissible values
     * are "POST" (default) or "GET".
     *
     * @param string HTTP method, one of "POST" or "GET".
     */
    method : 'POST',
    raw : false,

    /**
     * Configure a timeout, in milliseconds. If the request has not resolved
     * (either with success or with an error) within the provided timeframe,
     * it will automatically fail with error JX.Request.ERROR_TIMEOUT.
     *
     * @param int Timeout, in milliseconds (e.g. 3000 = 3 seconds).
     */
    timeout : null
  },

  initialize : function() {
    JX.Stratcom.listen('unload', 'tag:window', JX.Request.shutdown);
  }

});

