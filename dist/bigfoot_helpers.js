// bigfoot-helpers.js
window.sanitizeFootnoteContent = (content, backlinkRef) => {
  content = removeBackLinks(content, backlinkRef);
  return content
    .replace(/"/g, "&quot;")
    .replace(/&lt;/g, "&ltsym;")
    .replace(/&gt;/g, "&gtsym;")
    .replace(/'/g, "&apos;");
};

window.removeBackLinks = (footnoteHTML, backlinkID) => {
  let regex;
  if (backlinkID.indexOf(" ") >= 0) {
    backlinkID = backlinkID
      .trim()
      .replace(/\s+/g, "|")
      .replace(/(.*)/g, "($1)");
  }
  regex = new RegExp(
    `(\\s|&nbsp;)*<\\s*a[^#<]*#${backlinkID}[^>]*>(.*?)<\\s*/\\s*a>`,
    "g"
  );
  return footnoteHTML.replace(regex, "").replace("[]", "");
};
  
window.wrapInParagraph = (content) => {
  return content.indexOf("<") !== 0 ? `<p>${content}</p>` : content;
};

window.createFootnoteButton = (
  footnoteNum,
  footnoteIDNum,
  footnoteContent,
  settings
) => {
  return settings.buttonMarkup
    .replace(/\{\{FOOTNOTENUM\}\}/g, footnoteNum)
    .replace(/\{\{FOOTNOTEID\}\}/g, footnoteIDNum)
    .replace(/\{\{FOOTNOTECONTENT\}\}/g, footnoteContent);
};

window.replaceAttributesWithReference = (
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

window.replaceWithReferenceAttributes = function (
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

window.cleanFootnoteLinks = function ($footnoteAnchors, footnoteLinks, settings) {
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

window. calculatePixelDimension = function (dim, $el) {
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
  
window. baseFontSize = function () {
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

// Helper function to calculate the left position of the footnote
window. calculateLeftPosition = ($button, roomLeft, maxWidth) => {
  const marginLeft = parseFloat($button.css("margin-left"));
  const buttonWidth = $button.outerWidth() / 2;
  return -roomLeft.leftRelative * maxWidth + marginLeft + buttonWidth;
};

// Helper function to calculate max width based on CSS and window size
window. calculateMaxWidth = ($footnote, maxWidthInCSS, settings) => {
  let relativeToWidth = 10000; // MAX_HEIGHT_DEFAULT
  if (maxWidthInCSS > 1) return maxWidthInCSS;

  if (settings.maxWidthRelativeTo) {
    const $relativeElement = $(settings.maxWidthRelativeTo);
    if ($relativeElement.length > 0) {
      relativeToWidth = $relativeElement.outerWidth();
    }
  }
  return Math.min(window.innerWidth, relativeToWidth) * maxWidthInCSS;
};

window.positionTooltip = function ($popover, leftRelative) {
  var $tooltip;
  if (leftRelative == null) {
    leftRelative = 0.5;
  }
  $tooltip = $popover.find(".bigfoot-footnote__tooltip");
  if ($tooltip.length > 0) {
    $tooltip.css("left", "" + leftRelative * 100 + "%");
  }
};

// Helper function to update the width and position of the footnote
window.updateWidthAndPosition = ($footnote, $button, roomLeft, settings) => {
  const maxWidthInCSS =
    parseFloat($footnote.attr("bigfoot-max-width")) || 1;
  let maxWidth = calculateMaxWidth($footnote, maxWidthInCSS, settings);
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
  