(function () {
  (function ($) {
    // Constants
    const POPOVER_MARGIN = 15;
    const MAX_HEIGHT_DEFAULT = 10000;

    return ($.bigfoot = function (options) {
      var addBreakpoint,
        baseFontSize,
        bigfoot,
        buttonHover,
        calculatePixelDimension,
        cleanFootnoteLinks,
        clickButton,
        createPopover,
        defaults,
        deleteEmptyOrHR,
        escapeKeypress,
        footnoteInit,
        getSetting,
        makeDefaultCallbacks,
        popoverStates,
        positionTooltip,
        removeBackLinks,
        removeBreakpoint,
        removePopovers,
        replaceWithReferenceAttributes,
        repositionFeet,
        roomCalc,
        settings,
        touchClick,
        unhoverFeet,
        updateSetting,
        viewportDetails;
      bigfoot = void 0;
      defaults = {
        actionOriginalFN: "hide",
        activateCallback: function () {},
        activateOnHover: false,
        allowMultipleFN: false,
        anchorPattern: /(fn|footnote|note)[:\-_\d]/gi,
        anchorParentTagname: "sup",
        breakpoints: {},
        deleteOnUnhover: false,
        footnoteParentClass: "footnote",
        footnoteTagname: "li",
        hoverDelay: 250,
        numberResetSelector: void 0,
        popoverDeleteDelay: 300,
        popoverCreateDelay: 100,
        positionContent: true,
        preventPageScroll: true,
        scope: false,
        useFootnoteOnlyOnce: true,
        contentMarkup:
          "<aside class='bigfoot-footnote is-positioned-bottom' data-footnote-number='{{FOOTNOTENUM}}' data-footnote-identifier='{{FOOTNOTEID}}' alt='Footnote {{FOOTNOTENUM}}'> <div class='bigfoot-footnote__wrapper'> <div class='bigfoot-footnote__content'> {{FOOTNOTECONTENT}} </div></div> <div class='bigfoot-footnote__tooltip'></div> </aside>",
        buttonMarkup:
          "<div class='bigfoot-footnote__container'> <button class='bigfoot-footnote__button' id='{{SUP:data-footnote-backlink-ref}}' data-footnote-number='{{FOOTNOTENUM}}' data-footnote-identifier='{{FOOTNOTEID}}' alt='See Footnote {{FOOTNOTENUM}}' rel='footnote' data-bigfoot-footnote='{{FOOTNOTECONTENT}}'> <svg class='bigfoot-footnote__button__circle' viewbox='0 0 6 6' preserveAspectRatio='xMinYMin'><circle r='3' cx='3' cy='3' fill='white'></circle></svg> <svg class='bigfoot-footnote__button__circle' viewbox='0 0 6 6' preserveAspectRatio='xMinYMin'><circle r='3' cx='3' cy='3' fill='white'></circle></svg> <svg class='bigfoot-footnote__button__circle' viewbox='0 0 6 6' preserveAspectRatio='xMinYMin'><circle r='3' cx='3' cy='3' fill='white'></circle></svg> </button></div>",
      };
      settings = $.extend(defaults, options);
      popoverStates = {};
      footnoteInit = function () {
        const footnoteButtonSearchQuery = settings.scope
          ? `${settings.scope} a[href*='#']`
          : "a[href*='#']";

        const $footnoteAnchors = $(footnoteButtonSearchQuery).filter(
          function () {
            const $this = $(this);
            const relAttr = $this.attr("rel") || "";
            return (
              `${$this.attr("href")}${relAttr}`.match(settings.anchorPattern) &&
              !$this.closest(
                `[class*=${settings.footnoteParentClass}]:not(a):not(${settings.anchorParentTagname})`
              ).length
            );
          }
        );

        const footnotes = [];
        const footnoteLinks = [];
        const finalFNLinks = [];

        cleanFootnoteLinks($footnoteAnchors, footnoteLinks);

        $(footnoteLinks).each(function () {
          const relatedFN =
            $(this)
              .data("footnote-ref")
              .replace(/[:.+~*\]\[]/g, "\\$&") +
            (settings.useFootnoteOnlyOnce ? ":not(.footnote-processed)" : "");

          const $closestFootnoteEl = $(relatedFN).closest(
            settings.footnoteTagname
          );

          if ($closestFootnoteEl.length > 0) {
            footnotes.push(
              $closestFootnoteEl.first().addClass("footnote-processed")
            );
            finalFNLinks.push(this);
          }
        });

        let footnoteIDNum =
          $("[data-footnote-identifier]:last").length < 1
            ? 0
            : +$("[data-footnote-identifier]:last").data("footnote-identifier");

        footnotes.forEach((footnote, i) => {
          let footnoteContent = $(footnote).html().trim();
          footnoteContent = sanitizeFootnoteContent(
            footnoteContent,
            $(finalFNLinks[i]).data("footnote-backlink-ref")
          );

          footnoteIDNum += 1;
          let footnoteNum = footnoteIDNum;

          if (settings.numberResetSelector) {
            const $curResetElement = $(finalFNLinks[i]).closest(
              settings.numberResetSelector
            );
            footnoteNum = $curResetElement.is($lastResetElement)
              ? footnoteNum + 1
              : 1;
            $lastResetElement = $curResetElement;
          }

          footnoteContent = wrapInParagraph(footnoteContent);
          let footnoteButton = createFootnoteButton(
            footnoteNum,
            footnoteIDNum,
            footnoteContent
          );

          footnoteButton = replaceAttributesWithReference(
            footnoteButton,
            $(finalFNLinks[i]),
            $(footnotes[i])
          );
          $(footnoteButton).insertBefore($(finalFNLinks[i]));

          handleOriginalFootnote($(finalFNLinks[i]), $(footnotes[i]));
        });
      };

      // Helper Functions
      const sanitizeFootnoteContent = (content, backlinkRef) => {
        content = removeBackLinks(content, backlinkRef);
        return content
          .replace(/"/g, "&quot;")
          .replace(/&lt;/g, "&ltsym;")
          .replace(/&gt;/g, "&gtsym;")
          .replace(/'/g, "&apos;");
      };

      const wrapInParagraph = (content) => {
        return content.indexOf("<") !== 0 ? `<p>${content}</p>` : content;
      };

      const createFootnoteButton = (
        footnoteNum,
        footnoteIDNum,
        footnoteContent
      ) => {
        return settings.buttonMarkup
          .replace(/\{\{FOOTNOTENUM\}\}/g, footnoteNum)
          .replace(/\{\{FOOTNOTEID\}\}/g, footnoteIDNum)
          .replace(/\{\{FOOTNOTECONTENT\}\}/g, footnoteContent);
      };

      const replaceAttributesWithReference = (
        footnoteButton,
        $relevantFNLink,
        $relevantFootnote
      ) => {
        footnoteButton = replaceWithReferenceAttributes(
          footnoteButton,
          "SUP",
          $relevantFNLink
        );
        return replaceWithReferenceAttributes(
          footnoteButton,
          "FN",
          $relevantFootnote
        );
      };

      const handleOriginalFootnote = ($relevantFNLink, $relevantFootnote) => {
        const $parent = $relevantFootnote.parent();
        switch (settings.actionOriginalFN.toLowerCase()) {
          case "hide":
            $relevantFNLink.addClass("footnote-print-only");
            $relevantFootnote.addClass("footnote-print-only");
            deleteEmptyOrHR($parent);
            break;
          case "delete":
            $relevantFNLink.remove();
            $relevantFootnote.remove();
            deleteEmptyOrHR($parent);
            break;
          default:
            $relevantFNLink.addClass("footnote-print-only");
        }
      };
      cleanFootnoteLinks = function ($footnoteAnchors, footnoteLinks) {
        var $parent, linkHREF, linkID;
        if (footnoteLinks == null) {
          footnoteLinks = [];
        }
        $parent = void 0;
        $supChild = void 0;
        linkHREF = void 0;
        linkID = void 0;
        $footnoteAnchors.each(function () {
          var $child, $this;
          $this = $(this);
          linkHREF = "#" + $this.attr("href").split("#")[1];
          $parent = $this.closest(settings.anchorParentTagname);
          $child = $this.find(settings.anchorParentTagname);
          if ($parent.length > 0) {
            linkID = ($parent.attr("id") || "") + ($this.attr("id") || "");
            return footnoteLinks.push(
              $parent.attr({
                "data-footnote-backlink-ref": linkID,
                "data-footnote-ref": linkHREF,
              })
            );
          } else if ($child.length > 0) {
            linkID = ($child.attr("id") || "") + ($this.attr("id") || "");
            return footnoteLinks.push(
              $this.attr({
                "data-footnote-backlink-ref": linkID,
                "data-footnote-ref": linkHREF,
              })
            );
          } else {
            linkID = $this.attr("id") || "";
            return footnoteLinks.push(
              $this.attr({
                "data-footnote-backlink-ref": linkID,
                "data-footnote-ref": linkHREF,
              })
            );
          }
        });
      };
      deleteEmptyOrHR = function ($el) {
        var $parent;
        $parent = void 0;
        if (
          $el.is(":empty") ||
          $el.children(":not(.footnote-print-only)").length === 0
        ) {
          $parent = $el.parent();
          if (settings.actionOriginalFN.toLowerCase() === "delete") {
            $el.remove();
          } else {
            $el.addClass("footnote-print-only");
          }
          return deleteEmptyOrHR($parent);
        } else if (
          $el.children(":not(.footnote-print-only)").length ===
          $el.children("hr:not(.footnote-print-only)").length
        ) {
          $parent = $el.parent();
          if (settings.actionOriginalFN.toLowerCase() === "delete") {
            $el.remove();
          } else {
            $el.children("hr").addClass("footnote-print-only");
            $el.addClass("footnote-print-only");
          }
          return deleteEmptyOrHR($parent);
        }
      };
      removeBackLinks = function (footnoteHTML, backlinkID) {
        var regex;
        if (backlinkID.indexOf(" ") >= 0) {
          backlinkID = backlinkID
            .trim()
            .replace(/\s+/g, "|")
            .replace(/(.*)/g, "($1)");
        }
        regex = new RegExp(
          "(\\s|&nbsp;)*<\\s*a[^#<]*#" + backlinkID + "[^>]*>(.*?)<\\s*/\\s*a>",
          "g"
        );
        return footnoteHTML.replace(regex, "").replace("[]", "");
      };
      replaceWithReferenceAttributes = function (
        string,
        referenceKeyword,
        $referenceElement
      ) {
        var refMatches, refRegex, refReplaceText;
        refRegex = new RegExp(
          "\\{\\{" + referenceKeyword + ":([^\\}]*)\\}\\}",
          "g"
        );
        refMatches = void 0;
        refReplaceText = void 0;
        refReplaceRegex = void 0;
        refMatches = refRegex.exec(string);
        while (refMatches) {
          if (refMatches[1]) {
            refReplaceText = $referenceElement.attr(refMatches[1]) || "";
            string = string.replace(
              "{{" + referenceKeyword + ":" + refMatches[1] + "}}",
              refReplaceText
            );
          }
          refMatches = refRegex.exec(string);
        }
        return string;
      };
      buttonHover = function (event) {
        var $buttonHovered, dataIdentifier, otherPopoverSelector;
        if (settings.activateOnHover) {
          $buttonHovered = $(event.target).closest(".bigfoot-footnote__button");
          dataIdentifier =
            "[data-footnote-identifier='" +
            $buttonHovered.attr("data-footnote-identifier") +
            "']";
          if ($buttonHovered.hasClass("is-active")) {
            return;
          }
          $buttonHovered.addClass("is-hover-instantiated");
          if (!settings.allowMultipleFN) {
            otherPopoverSelector =
              ".bigfoot-footnote:not(" + dataIdentifier + ")";
            removePopovers(otherPopoverSelector);
          }
          createPopover(".bigfoot-footnote__button" + dataIdentifier).addClass(
            "is-hover-instantiated"
          );
        }
      };
      touchClick = function (event) {
        var $nearButton, $nearFootnote, $target;
        $target = $(event.target);
        $nearButton = $target.closest(".bigfoot-footnote__button");
        $nearFootnote = $target.closest(".bigfoot-footnote");
        if ($nearButton.length > 0) {
          event.preventDefault();
          clickButton($nearButton);
        } else if (
          $nearFootnote.length < 1 &&
          $(".bigfoot-footnote").length > 0
        ) {
          removePopovers();
        }
      };
      clickButton = function ($button) {
        var dataIdentifier;
        $button.blur();
        dataIdentifier =
          "data-footnote-identifier='" +
          $button.attr("data-footnote-identifier") +
          "'";
        if ($button.hasClass("changing")) {
          return;
        } else if (!$button.hasClass("is-active")) {
          $button.addClass("changing");
          setTimeout(function () {
            return $button.removeClass("changing");
          }, settings.popoverCreateDelay);
          createPopover(".bigfoot-footnote__button[" + dataIdentifier + "]");
          $button.addClass("is-click-instantiated");
          if (!settings.allowMultipleFN) {
            removePopovers(".bigfoot-footnote:not([" + dataIdentifier + "])");
          }
        } else {
          if (!settings.allowMultipleFN) {
            removePopovers();
          } else {
            removePopovers(".bigfoot-footnote[" + dataIdentifier + "]");
          }
        }
      };
      createPopover = function (selector) {
        var $buttons, $popoversCreated;
        $buttons = void 0;
        if (typeof selector !== "string" && settings.allowMultipleFN) {
          $buttons = selector;
        } else if (typeof selector !== "string") {
          $buttons = selector.first();
        } else if (settings.allowMultipleFN) {
          $buttons = $(selector).closest(".bigfoot-footnote__button");
        } else {
          $buttons = $(selector + ":first").closest(
            ".bigfoot-footnote__button"
          );
        }
        $popoversCreated = $();
        $buttons.each(function () {
          var $content, $contentContainer, $this, content;
          $this = $(this);
          content = void 0;
          try {
            content = settings.contentMarkup
              .replace(
                /\{\{FOOTNOTENUM\}\}/g,
                $this.attr("data-footnote-number")
              )
              .replace(
                /\{\{FOOTNOTEID\}\}/g,
                $this.attr("data-footnote-identifier")
              )
              .replace(
                /\{\{FOOTNOTECONTENT\}\}/g,
                $this.attr("data-bigfoot-footnote")
              )
              .replace(/\&gtsym\;/g, "&gt;")
              .replace(/\&ltsym\;/g, "&lt;");
            return (content = replaceWithReferenceAttributes(
              content,
              "BUTTON",
              $this
            ));
          } finally {
            $content = $(content);
            try {
              settings.activateCallback($content, $this);
            } catch (_error) {}
            $content.insertAfter($buttons);
            popoverStates[$this.attr("data-footnote-identifier")] = "init";
            $content.attr(
              "bigfoot-max-width",
              calculatePixelDimension($content.css("max-width"), $content)
            );
            $content.css("max-width", MAX_HEIGHT_DEFAULT);
            $contentContainer = $content.find(".bigfoot-footnote__content");
            $content.attr(
              "data-bigfoot-max-height",
              calculatePixelDimension(
                $contentContainer.css("max-height"),
                $contentContainer
              )
            );
            repositionFeet();
            $this.addClass("is-active");
            $content.find(".bigfoot-footnote__content").bindScrollHandler();
            $popoversCreated = $popoversCreated.add($content);
          }
        });
        setTimeout(function () {
          return $popoversCreated.addClass("is-active");
        }, settings.popoverCreateDelay);
        return $popoversCreated;
      };
      baseFontSize = function () {
        var el, size;
        el = document.createElement("div");
        el.style.cssText =
          "display:inline-block;padding:0;line-height:1;position:absolute;visibility:hidden;font-size:1em;";
        el.appendChild(document.createElement("M"));
        document.body.appendChild(el);
        size = el.offsetHeight;
        document.body.removeChild(el);
        return size;
      };
      calculatePixelDimension = function (dim, $el) {
        if (dim === "none") {
          dim = MAX_HEIGHT_DEFAULT;
        } else if (dim.indexOf("rem") >= 0) {
          dim = parseFloat(dim) * baseFontSize();
        } else if (dim.indexOf("em") >= 0) {
          dim = parseFloat(dim) * parseFloat($el.css("font-size"));
        } else if (dim.indexOf("px") >= 0) {
          dim = parseFloat(dim);
          if (dim <= 60) {
            dim = dim / parseFloat($el.parent().css("width"));
          }
        } else if (dim.indexOf("%") >= 0) {
          dim = parseFloat(dim) / 100;
        }
        return dim;
      };
      $.fn.bindScrollHandler = function () {
        if (!settings.preventPageScroll) {
          return $(this);
        }
        $(this).on("DOMMouseScroll mousewheel", function (event) {
          var $popover,
            $this,
            delta,
            height,
            prevent,
            scrollHeight,
            scrollTop,
            up;
          $this = $(this);
          scrollTop = $this.scrollTop();
          scrollHeight = $this[0].scrollHeight;
          height = parseInt($this.css("height"));
          $popover = $this.closest(".bigfoot-footnote");
          if ($this.scrollTop() > 0 && $this.scrollTop() < 10) {
            $popover.addClass("is-scrollable");
          }
          if (!$popover.hasClass("is-scrollable")) {
            return;
          }
          delta =
            event.type === "DOMMouseScroll"
              ? event.originalEvent.detail * -40
              : event.originalEvent.wheelDelta;
          up = delta > 0;
          prevent = function () {
            event.stopPropagation();
            event.preventDefault();
            event.returnValue = false;
            return false;
          };
          if (!up && -delta > scrollHeight - height - scrollTop) {
            $this.scrollTop(scrollHeight);
            $popover.addClass("is-fully-scrolled");
            return prevent();
          } else if (up && delta > scrollTop) {
            $this.scrollTop(0);
            $popover.removeClass("is-fully-scrolled");
            return prevent();
          } else {
            return $popover.removeClass("is-fully-scrolled");
          }
        });
        return $(this);
      };
      unhoverFeet = function (e) {
        if (settings.deleteOnUnhover && settings.activateOnHover) {
          return setTimeout(function () {
            $target = $(e.target).closest(
              ".bigfoot-footnote, .bigfoot-footnote__button"
            );
            if (
              $(".bigfoot-footnote__button:hover, .bigfoot-footnote:hover")
                .length < 1
            ) {
              return removePopovers();
            }
          }, settings.hoverDelay);
        }
      };
      escapeKeypress = function (event) {
        if (event.keyCode === 27) {
          return removePopovers();
        }
      };
      removePopovers = function (footnotes, timeout) {
        var $buttonsClosed, $linkedButton, $this, footnoteID;
        if (footnotes == null) {
          footnotes = ".bigfoot-footnote";
        }
        if (timeout == null) {
          timeout = settings.popoverDeleteDelay;
        }
        $buttonsClosed = $();
        footnoteID = void 0;
        $linkedButton = void 0;
        $this = void 0;
        $(footnotes).each(function () {
          $this = $(this);
          footnoteID = $this.attr("data-footnote-identifier");
          $linkedButton = $(
            ".bigfoot-footnote__button[data-footnote-identifier='" +
              footnoteID +
              "']"
          );
          if (!$linkedButton.hasClass("changing")) {
            $buttonsClosed = $buttonsClosed.add($linkedButton);
            $linkedButton
              .removeClass(
                "is-active is-hover-instantiated is-click-instantiated"
              )
              .addClass("changing");
            $this.removeClass("is-active").addClass("disapearing");
            return setTimeout(function () {
              $this.remove();
              delete popoverStates[footnoteID];
              return $linkedButton.removeClass("changing");
            }, timeout);
          }
        });
        return $buttonsClosed;
      };
      const repositionFeet = function (e) {
        if (!settings.positionContent) return;

        const type = e ? e.type : "resize";
        $(".bigfoot-footnote").each(function () {
          const $this = $(this);
          const identifier = $this.attr("data-footnote-identifier");
          const $contentWrapper = $this.find(".bigfoot-footnote__content");
          const $button = $this.siblings(".bigfoot-footnote__button");
          const marginSize = parseFloat($this.css("margin-top"));
          const totalHeight = 2 * marginSize + $this.outerHeight();
          const maxHeightInCSS =
            +$this.attr("data-bigfoot-max-height") || MAX_HEIGHT_DEFAULT;

          // Calculate room available around the button
          const roomLeft = roomCalc($button);
          let positionOnTop = shouldPositionOnTop(roomLeft, totalHeight);

          updatePopoverState($this, identifier, positionOnTop, roomLeft);

          const maxHeightOnScreen =
            roomLeft.bottomRoom - marginSize - POPOVER_MARGIN;
          $contentWrapper.css({
            "max-height": Math.min(maxHeightOnScreen, maxHeightInCSS) + "px",
          });

          if (type === "resize") {
            updateWidthAndPosition($this, $button, roomLeft);
          }

          // Add 'is-scrollable' class if the content overflows
          if ($contentWrapper[0].scrollHeight > parseInt($this.outerHeight())) {
            $this.addClass("is-scrollable");
          }
        });
      };

      // Helper function to check whether to position the footnote on top
      const shouldPositionOnTop = (roomLeft, totalHeight) => {
        return (
          roomLeft.bottomRoom < totalHeight &&
          roomLeft.topRoom > roomLeft.bottomRoom
        );
      };

      // Helper function to update the popover state
      const updatePopoverState = (
        $footnote,
        identifier,
        positionOnTop,
        roomLeft
      ) => {
        const lastState = popoverStates[identifier];
        if (positionOnTop && lastState !== "top") {
          popoverStates[identifier] = "top";
          $footnote
            .addClass("is-positioned-top")
            .removeClass("is-positioned-bottom");
          $footnote.css(
            "transform-origin",
            `${roomLeft.leftRelative * 100}% 100%`
          );
        } else if (!positionOnTop && lastState !== "bottom") {
          popoverStates[identifier] = "bottom";
          $footnote
            .removeClass("is-positioned-top")
            .addClass("is-positioned-bottom");
          $footnote.css(
            "transform-origin",
            `${roomLeft.leftRelative * 100}% 0%`
          );
        }
      };

      // Helper function to update the width and position of the footnote
      const updateWidthAndPosition = ($footnote, $button, roomLeft) => {
        const maxWidthInCSS =
          parseFloat($footnote.attr("bigfoot-max-width")) || 1;
        let maxWidth = calculateMaxWidth($footnote, maxWidthInCSS);
        const $mainWrap = $footnote.find(".bigfoot-footnote__wrapper");

        maxWidth = Math.min(
          maxWidth,
          $footnote.find(".bigfoot-footnote__content").outerWidth() + 1
        );
        $mainWrap.css("max-width", `${maxWidth}px`);

        const leftPosition = calculateLeftPosition($button, roomLeft, maxWidth);
        $footnote.css({ left: `${leftPosition}px` });

        positionTooltip($footnote, roomLeft.leftRelative);
      };

      // Helper function to calculate max width based on CSS and window size
      const calculateMaxWidth = ($footnote, maxWidthInCSS) => {
        if (maxWidthInCSS > 1) return maxWidthInCSS;

        let relativeToWidth = MAX_HEIGHT_DEFAULT;
        if (settings.maxWidthRelativeTo) {
          const $relativeElement = $(settings.maxWidthRelativeTo);
          if ($relativeElement.length > 0) {
            relativeToWidth = $relativeElement.outerWidth();
          }
        }
        return Math.min(window.innerWidth, relativeToWidth) * maxWidthInCSS;
      };

      // Helper function to calculate the left position of the footnote
      const calculateLeftPosition = ($button, roomLeft, maxWidth) => {
        const marginLeft = parseFloat($button.css("margin-left"));
        const buttonWidth = $button.outerWidth() / 2;
        return -roomLeft.leftRelative * maxWidth + marginLeft + buttonWidth;
      };

      positionTooltip = function ($popover, leftRelative) {
        var $tooltip;
        if (leftRelative == null) {
          leftRelative = 0.5;
        }
        $tooltip = $popover.find(".bigfoot-footnote__tooltip");
        if ($tooltip.length > 0) {
          $tooltip.css("left", "" + leftRelative * 100 + "%");
        }
      };
      roomCalc = function ($el) {
        var elHeight, elLeftMargin, elWidth, leftRoom, topRoom, w;
        elLeftMargin = parseFloat($el.css("margin-left"));
        elWidth = parseFloat($el.outerWidth()) - elLeftMargin;
        elHeight = parseFloat($el.outerHeight());
        w = viewportDetails();
        topRoom = $el.offset().top - w.scrollY + elHeight / 2;
        leftRoom = $el.offset().left - w.scrollX + elWidth / 2;
        return {
          topRoom: topRoom,
          bottomRoom: w.height - topRoom,
          leftRoom: leftRoom,
          rightRoom: w.width - leftRoom,
          leftRelative: leftRoom / w.width,
          topRelative: topRoom / w.height,
        };
      };
      viewportDetails = function () {
        var $window;
        $window = $(window);
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: $window.scrollLeft(),
          scrollY: $window.scrollTop(),
        };
      };
      addBreakpoint = function (
        size,
        trueCallback,
        falseCallback,
        deleteDelay,
        removeOpen
      ) {
        var falseDefaultPositionSetting,
          minMax,
          mqListener,
          mql,
          query,
          s,
          trueDefaultPositionSetting;
        if (deleteDelay == null) {
          deleteDelay = settings.popoverDeleteDelay;
        }
        if (removeOpen == null) {
          removeOpen = true;
        }
        mql = void 0;
        minMax = void 0;
        s = void 0;
        if (typeof size === "string") {
          s =
            size.toLowerCase() === "iphone"
              ? "<320px"
              : size.toLowerCase() === "ipad"
              ? "<768px"
              : size;
          minMax =
            s.charAt(0) === ">" ? "min" : s.charAt(0) === "<" ? "max" : null;
          query = minMax ? "(" + minMax + "-width: " + s.substring(1) + ")" : s;
          mql = window.matchMedia(query);
        } else {
          mql = size;
        }
        if (mql.media && mql.media === "invalid") {
          return {
            added: false,
            mq: mql,
            listener: null,
          };
        }
        trueDefaultPositionSetting = minMax === "min";
        falseDefaultPositionSetting = minMax === "max";
        trueCallback =
          trueCallback ||
          makeDefaultCallbacks(
            removeOpen,
            deleteDelay,
            trueDefaultPositionSetting,
            function ($popover) {
              return $popover.addClass("is-bottom-fixed");
            }
          );
        falseCallback =
          falseCallback ||
          makeDefaultCallbacks(
            removeOpen,
            deleteDelay,
            falseDefaultPositionSetting,
            function () {}
          );
        mqListener = function (mq) {
          if (mq.matches) {
            trueCallback(removeOpen, bigfoot);
          } else {
            falseCallback(removeOpen, bigfoot);
          }
        };
        mql.addListener(mqListener);
        mqListener(mql);
        settings.breakpoints[size] = {
          added: true,
          mq: mql,
          listener: mqListener,
        };
        return settings.breakpoints[size];
      };
      makeDefaultCallbacks = function (deleteDelay, position, callback) {
        return function (removeOpen, bigfoot) {
          var $closedPopovers;
          $closedPopovers = void 0;
          if (removeOpen) {
            $closedPopovers = bigfoot.removePopovers();
            bigfoot.updateSetting("activateCallback", callback);
          }
          return setTimeout(function () {
            bigfoot.updateSetting("positionContent", position);
            if (removeOpen) {
              return bigfoot.activate($closedPopovers);
            }
          }, deleteDelay);
        };
      };
      removeBreakpoint = function (target, callback) {
        var b, breakpoint, mqFound;
        mq = null;
        b = void 0;
        mqFound = false;
        if (typeof target === "string") {
          mqFound = settings.breakpoints[target] !== undefined;
        } else {
          for (b in settings.breakpoints) {
            if (
              settings.breakpoints.hasOwnProperty(b) &&
              settings.breakpoints[b].mq === target
            ) {
              mqFound = true;
            }
          }
        }
        if (mqFound) {
          breakpoint = settings.breakpoints[b || target];
          if (callback) {
            callback({
              matches: false,
            });
          } else {
            breakpoint.listener({
              matches: false,
            });
          }
          breakpoint.mq.removeListener(breakpoint.listener);
          delete settings.breakpoints[b || target];
        }
        return mqFound;
      };
      updateSetting = function (newSettings, value) {
        var oldValue, prop;
        oldValue = void 0;
        if (typeof newSettings === "string") {
          oldValue = settings[newSettings];
          settings[newSettings] = value;
        } else {
          oldValue = {};
          for (prop in newSettings) {
            if (newSettings.hasOwnProperty(prop)) {
              oldValue[prop] = settings[prop];
              settings[prop] = newSettings[prop];
            }
          }
        }
        return oldValue;
      };
      getSetting = function (setting) {
        return settings[setting];
      };
      $(document).ready(function () {
        footnoteInit();
        $(document).on("mouseenter", ".bigfoot-footnote__button", buttonHover);
        $(document).on("touchend click", touchClick);
        $(document).on("mouseout", ".is-hover-instantiated", unhoverFeet);
        $(document).on("keyup", escapeKeypress);
        $(window).on("scroll resize", repositionFeet);
        return $(document).on("gestureend", function () {
          return repositionFeet();
        });
      });
      bigfoot = {
        removePopovers: removePopovers,
        createPopover: createPopover,
        activate: createPopover,
        repositionFeet: repositionFeet,
        reposition: repositionFeet,
        addBreakpoint: addBreakpoint,
        removeBreakpoint: removeBreakpoint,
        getSetting: getSetting,
        updateSetting: updateSetting,
      };
      return bigfoot;
    });
  })(jQuery);
}).call(this);
