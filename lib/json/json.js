angular
.module('dojo', [])
.provider('stamp', function() {
  this.$get = function() {
    var stamp = {
      // summary:
      //                TODOC
    };

    // Methods to convert dates to or from a wire (string) format using well-known conventions

    stamp.fromISOString = function(/*String*/ formattedString, /*Number?*/ defaultTime){
      // summary:
      //                Returns a Date object given a string formatted according to a subset of the ISO-8601 standard.
      //
      // description:
      //                Accepts a string formatted according to a profile of ISO8601 as defined by
      //                [RFC3339](http://www.ietf.org/rfc/rfc3339.txt), except that partial input is allowed.
      //                Can also process dates as specified [by the W3C](http://www.w3.org/TR/NOTE-datetime)
      //                The following combinations are valid:
      //
      //                - dates only
      //                        - yyyy
      //                        - yyyy-MM
      //                        - yyyy-MM-dd
      //                - times only, with an optional time zone appended
      //                        - THH:mm
      //                        - THH:mm:ss
      //                        - THH:mm:ss.SSS
      //                - and "datetimes" which could be any combination of the above
      //
      //                timezones may be specified as Z (for UTC) or +/- followed by a time expression HH:mm
      //                Assumes the local time zone if not specified.  Does not validate.  Improperly formatted
      //                input may return null.  Arguments which are out of bounds will be handled
      //                by the Date constructor (e.g. January 32nd typically gets resolved to February 1st)
      //                Only years between 100 and 9999 are supported.
      // formattedString:
      //                A string such as 2005-06-30T08:05:00-07:00 or 2005-06-30 or T08:05:00
      // defaultTime:
      //                Used for defaults for fields omitted in the formattedString.
      //                Uses 1970-01-01T00:00:00.0Z by default.

      if(!stamp._isoRegExp){
        stamp._isoRegExp =
          //TODO: could be more restrictive and check for 00-59, etc.
          /^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;
      }

      var match = stamp._isoRegExp.exec(formattedString),
          result = null;

      if(match){
        match.shift();
        if(match[1]){match[1]--;} // Javascript Date months are 0-based
        if(match[6]){match[6] *= 1000;} // Javascript Date expects fractional seconds as milliseconds

        if(defaultTime){
          // mix in defaultTime.  Relatively expensive, so use || operators for the fast path of defaultTime === 0
          defaultTime = new Date(defaultTime);
          array.forEach(array.map(["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds", "Milliseconds"], function(prop){
            return defaultTime["get" + prop]();
          }), function(value, index){
            match[index] = match[index] || value;
          });
        }
        result = new Date(match[0]||1970, match[1]||0, match[2]||1, match[3]||0, match[4]||0, match[5]||0, match[6]||0); //TODO: UTC defaults
        if(match[0] < 100){
          result.setFullYear(match[0] || 1970);
        }

        var offset = 0,
            zoneSign = match[7] && match[7].charAt(0);
        if(zoneSign != 'Z'){
          offset = ((match[8] || 0) * 60) + (Number(match[9]) || 0);
          if(zoneSign != '-'){ offset *= -1; }
        }
        if(zoneSign){
          offset -= result.getTimezoneOffset();
        }
        if(offset){
          result.setTime(result.getTime() + offset * 60000);
        }
      }

      return result; // Date or null
    };

    /*=====
      var __Options = {
    // selector: String
    //                "date" or "time" for partial formatting of the Date object.
    //                Both date and time will be formatted by default.
    // zulu: Boolean
    //                if true, UTC/GMT is used for a timezone
    // milliseconds: Boolean
    //                if true, output milliseconds
    };
    =====*/

    stamp.toISOString = function(/*Date*/ dateObject, /*__Options?*/ options){
      // summary:
      //                Format a Date object as a string according a subset of the ISO-8601 standard
      //
      // description:
      //                When options.selector is omitted, output follows [RFC3339](http://www.ietf.org/rfc/rfc3339.txt)
      //                The local time zone is included as an offset from GMT, except when selector=='time' (time without a date)
      //                Does not check bounds.  Only years between 100 and 9999 are supported.
      //
      // dateObject:
      //                A Date object

      var _ = function(n){ return (n < 10) ? "0" + n : n; };
      options = options || {};
      var formattedDate = [],
          getter = options.zulu ? "getUTC" : "get",
          date = "";
      if(options.selector != "time"){
        var year = dateObject[getter+"FullYear"]();
        date = ["0000".substr((year+"").length)+year, _(dateObject[getter+"Month"]()+1), _(dateObject[getter+"Date"]())].join('-');
      }
      formattedDate.push(date);
      if(options.selector != "date"){
        var time = [_(dateObject[getter+"Hours"]()), _(dateObject[getter+"Minutes"]()), _(dateObject[getter+"Seconds"]())].join(':');
        var millis = dateObject[getter+"Milliseconds"]();
        if(options.milliseconds){
          time += "."+ (millis < 100 ? "0" : "") + _(millis);
        }
        if(options.zulu){
          time += "Z";
        }else if(options.selector != "time"){
          var timezoneOffset = dateObject.getTimezoneOffset();
          var absOffset = Math.abs(timezoneOffset);
          time += (timezoneOffset > 0 ? "-" : "+") +
            _(Math.floor(absOffset/60)) + ":" + _(absOffset%60);
        }
        formattedDate.push(time);
      }
      return formattedDate.join('T'); // String
    };

    return stamp;
  }
})
  .provider('json', function() {
    this.$get = ['stamp', function(stamp) {
      djson = {};
      djson.fromJson = function(js) {
        return eval("(" + js + ")"); // Object
      };

      djson._escapeString = JSON.stringify; // just delegate to json.stringify

      djson.toJsonIndentStr = "\t";
      djson.toJson = function(it, prettyPrint){
        return JSON.stringify(it, function(key, value){
          if(value){
            var tf = value.__json__||value.json;
            if(typeof tf == "function"){
              return tf.call(value);
            }
          }
          return value;
        }, prettyPrint && djson.toJsonIndentStr);        // String
      };

      var json = {};
      json.resolveJson = function(/*Object*/ root, /*Object?*/ args){
        args = args || {};
        var idAttribute = args.idAttribute || 'id';
        var refAttribute = this.refAttribute;
        var idAsRef = args.idAsRef;
        var prefix = args.idPrefix || '';
        var assignAbsoluteIds = args.assignAbsoluteIds;
        var index = args.index || {}; // create an index if one doesn't exist
        var timeStamps = args.timeStamps;
        var ref,reWalk=[];
        var pathResolveRegex = /^(.*\/)?(\w+:\/\/)|[^\/\.]+\/\.\.\/|^.*\/(\/)/;
        var addProp = this._addProp;
        var F = function(){};
        function walk(it, stop, defaultId, needsPrefix, schema, defaultObject){
          // this walks the new graph, resolving references and making other changes
          var i, update, val, id = idAttribute in it ? it[idAttribute] : defaultId;
          if(idAttribute in it || ((id !== undefined) && needsPrefix)){
            id = (prefix + id).replace(pathResolveRegex,'$2$3');
          }
          var target = defaultObject || it;
          if(id !== undefined){ // if there is an id available...
            if(assignAbsoluteIds){
              it.__id = id;
            }
            if(args.schemas && (!(it instanceof Array)) && // won't try on arrays to do prototypes, plus it messes with queries
                (val = id.match(/^(.+\/)[^\.\[]*$/))){ // if it has a direct table id (no paths)
                  schema = args.schemas[val[1]];
                }
            // if the id already exists in the system, we should use the existing object, and just
            // update it... as long as the object is compatible
            if(index[id] && ((it instanceof Array) == (index[id] instanceof Array))){
              target = index[id];
              delete target.$ref; // remove this artifact
              delete target._loadObject;
              update = true;
            }else{
              var proto = schema && schema.prototype; // and if has a prototype
              if(proto){
                // if the schema defines a prototype, that needs to be the prototype of the object
                F.prototype = proto;
                target = new F();
              }
            }
            index[id] = target; // add the prefix, set _id, and index it
            if(timeStamps){
              timeStamps[id] = args.time;
            }
          }
          while(schema){
            var properties = schema.properties;
            if(properties){
              for(i in it){
                var propertyDefinition = properties[i];
                if(propertyDefinition && propertyDefinition.format == 'date-time' && typeof it[i] == 'string'){
                  it[i] = stamp.fromISOString(it[i]);
                }
              }
            }
            schema = schema["extends"];
          }
          var length = it.length;
          for(i in it){
            if(i==length){
              break;
            }
            if(it.hasOwnProperty(i)){
              val=it[i];
              if((typeof val =='object') && val && !(val instanceof Date) && i != '__parent'){
                ref=val[refAttribute] || (idAsRef && val[idAttribute]);
                if(!ref || !val.__parent){
                  if(it != reWalk){
                    val.__parent = target;
                  }
                }
                if(ref){ // a reference was found
                  // make sure it is a safe reference
                  delete it[i];// remove the property so it doesn't resolve to itself in the case of id.propertyName lazy values
                  var path = ref.toString().replace(/(#)([^\.\[])/,'$1.$2').match(/(^([^\[]*\/)?[^#\.\[]*)#?([\.\[].*)?/); // divide along the path
                  if(index[(prefix + ref).replace(pathResolveRegex,'$2$3')]){
                    ref = index[(prefix + ref).replace(pathResolveRegex,'$2$3')];
                  }else if((ref = (path[1]=='$' || path[1]=='this' || path[1]=='') ? root : index[(prefix + path[1]).replace(pathResolveRegex,'$2$3')])){  // a $ indicates to start with the root, otherwise start with an id
                    // if there is a path, we will iterate through the path references
                    if(path[3]){
                      path[3].replace(/(\[([^\]]+)\])|(\.?([^\.\[]+))/g,function(t,a,b,c,d){
                        ref = ref && ref[b ? b.replace(/[\"\'\\]/,'') : d];
                      });
                    }
                  }
                  if(ref){
                    val = ref;
                  }else{
                    // otherwise, no starting point was found (id not found), if stop is set, it does not exist, we have
                    // unloaded reference, if stop is not set, it may be in a part of the graph not walked yet,
                    // we will wait for the second loop
                    if(!stop){
                      var rewalking;
                      if(!rewalking){
                        reWalk.push(target); // we need to rewalk it to resolve references
                      }
                      rewalking = true; // we only want to add it once
                      val = walk(val, false, val[refAttribute], true, propertyDefinition);
                      // create a lazy loaded object
                      val._loadObject = args.loader;
                    }
                  }
                }else{
                  if(!stop){ // if we are in stop, that means we are in the second loop, and we only need to check this current one,
                    // further walking may lead down circular loops
                    val = walk(
                        val,
                        reWalk==it,
                        id === undefined ? undefined : addProp(id, i), // the default id to use
                        false,
                        propertyDefinition,
                        // if we have an existing object child, we want to
                        // maintain it's identity, so we pass it as the default object
                        target != it && typeof target[i] == 'object' && target[i]
                        );
                  }
                }
              }
              it[i] = val;
              if(target!=it && !target.__isDirty){// do updates if we are updating an existing object and it's not dirty
                var old = target[i];
                target[i] = val; // only update if it changed
                if(update && val !== old && // see if it is different
                    !target._loadObject && // no updates if we are just lazy loading
                    !(i.charAt(0) == '_' && i.charAt(1) == '_') && i != "$ref" &&
                    !(val instanceof Date && old instanceof Date && val.getTime() == old.getTime()) && // make sure it isn't an identical date
                    !(typeof val == 'function' && typeof old == 'function' && val.toString() == old.toString()) && // make sure it isn't an indentical function
                    index.onUpdate){
                      index.onUpdate(target,i,old,val); // call the listener for each update
                    }
              }
            }
          }

          if(update && (idAttribute in it || target instanceof Array)){
            // this means we are updating with a full representation of the object, we need to remove deleted
            for(i in target){
              if(!target.__isDirty && target.hasOwnProperty(i) && !it.hasOwnProperty(i) && !(i.charAt(0) == '_' && i.charAt(1) == '_') && !(target instanceof Array && isNaN(i))){
                if(index.onUpdate && i != "_loadObject" && i != "_idAttr"){
                  index.onUpdate(target,i,target[i],undefined); // call the listener for each update
                }
                delete target[i];
                while(target instanceof Array && target.length && target[target.length-1] === undefined){
                  // shorten the target if necessary
                  target.length--;
                }
              }
            }
          }else{
            if(index.onLoad){
              index.onLoad(target);
            }
          }
          return target;
        }
        if(root && typeof root == 'object'){
          root = walk(root,false,args.defaultId, true); // do the main walk through
          walk(reWalk,false); // re walk any parts that were not able to resolve references on the first round
        }
        return root;
      };

      json.fromJson = function(/*String*/ str,/*Object?*/ args){
        function ref(target){ // support call styles references as well
          var refObject = {};
          refObject[this.refAttribute] = target;
          return refObject;
        }
        try{
          var root = eval('(' + str + ')'); // do the eval
        }catch(e){
          throw new SyntaxError("Invalid JSON string: " + e.message + " parsing: "+ str);
        }
        if(root){
          return this.resolveJson(root, args);
        }
        return root;
      };

      json.toJson = function(it, prettyPrint, idPrefix, indexSubObjects, options) { 
        if (!options) options = {};
        if (options.instance) it = options.instance;
        // summary:
        //                Create a JSON serialization of an object.
        //                This has support for referencing, including circular references, duplicate references, and out-of-message references
        //                id and path-based referencing is supported as well and is based on http://www.json.com/2007/10/19/json-referencing-proposal-and-library/.
        // it:
        //                an object to be serialized.
        // prettyPrint:
        //                if true, we indent objects and arrays to make the output prettier.
        //                The variable dojo.toJsonIndentStr is used as the indent string
        //                -- to use something other than the default (tab),
        //                change that variable before calling dojo.toJson().
        // idPrefix:
        //                The prefix that has been used for the absolute ids
        // returns:
        //                a String representing the serialized version of the passed object.
        var useRefs = this._useRefs;
        var addProp = this._addProp;
        var refAttribute = this.refAttribute;
        idPrefix = idPrefix || ''; // the id prefix for this context
        var paths={};
        var generated = {};
        function serialize(it,path,_indentStr){
          if(typeof it == 'object' && it){
            var value;
            if(it instanceof Date){ // properly serialize dates
              return '"' + stamp.toISOString(it,{zulu:true}) + '"';
            }
            var id = it.__id;
            if(id){ // we found an identifiable object, we will just serialize a reference to it... unless it is the root
              if(path != '#' && ((useRefs && !id.match(/#/)) || paths[id])){
                var ref = id;
                if(id.charAt(0)!='#'){
                  if(it.__clientId == id){
                    ref = "cid:" + id;
                  }else if(id.substring(0, idPrefix.length) == idPrefix){ // see if the reference is in the current context
                    // a reference with a prefix matching the current context, the prefix should be removed
                    ref = id.substring(idPrefix.length);
                  }else{
                    // a reference to a different context, assume relative url based referencing
                    ref = id;
                  }
                }
                var refObject = {};
                refObject[refAttribute] = ref;
                return djson.toJson(refObject, prettyPrint);
              }
              path = id;
            }else{
              it.__id = path; // we will create path ids for other objects in case they are circular
              generated[path] = it;
            }
            paths[path] = it;// save it here so they can be deleted at the end
            _indentStr = _indentStr || "";
            var nextIndent = prettyPrint ? _indentStr + djson.toJsonIndentStr : "";
            var newLine = prettyPrint ? "\n" : "";
            var sep = prettyPrint ? " " : "";

            if(it instanceof Array){
              var res = _.map(it, function(obj,i){
                var val = serialize(obj, addProp(path, i), nextIndent);
                if(typeof val != "string"){
                  val = "undefined";
                }
                return newLine + nextIndent + val;
              });
              return "[" + res.join("," + sep) + newLine + _indentStr + "]";
            }

            var output = [];
            for(var i in it){
              if(it.hasOwnProperty(i)){
                var keyStr;
                if(typeof i == "number"){
                  keyStr = '"' + i + '"';
                }else if(typeof i == "string" && (i.charAt(0) != '_' || i.charAt(1) != '_')){
                  // we don't serialize our internal properties __id and __clientId
                  keyStr = djson._escapeString(i);
                }else{
                  // skip non-string or number keys
                  continue;
                }
                var val = serialize(it[i],addProp(path, i),nextIndent);
                if (val === undefined && options.includeEmptyKeys === true) val = '" "';
                if(typeof val != "string"){
                  // skip non-serializable values
                  continue;
                }
                output.push(newLine + nextIndent + keyStr + ":" + sep + val);
              }
            }
            return "{" + output.join("," + sep) + newLine + _indentStr + "}";
          }

          return djson.toJson(it); // use the default serializer for primitives
        }
        var json = serialize(it,'#','');
        if(!indexSubObjects){
          for(var i in generated)  {// cleanup the temporary path-generated ids
            delete generated[i].__id;
          }
        }
        return json;
      };

      json._addProp = function(id, prop){
        return id + (id.match(/#/) ? id.length == 1 ? '' : '.' : '#') + prop;
      };

      // refAttribute: String
      // This indicates what property is the reference property. This acts like the idAttribute
      // except that this is used to indicate the current object is a reference or only partially
      // loaded. This defaults to "$ref".
      json.refAttribute = "$ref";
      json._useRefs = false;
      json.serializeFunctions = false;

      json.serialize = function(instance, options) {
        var prettyPrint;
        if (!options) options = {};
        if (options.prettyPrint) prettyPrint = true;
        return json.toJson(instance, prettyPrint, '', false, options);
      }

      return json;
    }];
  });
