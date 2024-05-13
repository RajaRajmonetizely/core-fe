(() => {
    const script = document.currentScript;
  
    const loadWidget = () => {
      const widget = document.createElement("div");
  
      const widgetStyle = widget.style;
      widgetStyle.display = "none";
      widgetStyle.boxSizing = "border-box";
      widgetStyle.width = "60px";
      widgetStyle.height = "60px";
      widgetStyle.position = "absolute";
      widgetStyle.bottom = "40px";
      widgetStyle.right = "40px";
      widgetStyle.zIndex=1000;
  
      const iframe = document.createElement("iframe");
  
      const iframeStyle = iframe.style;
      iframeStyle.boxSizing = "borderBox";
      iframeStyle.position = "absolute";
      iframeStyle.right = 0;
      iframeStyle.top = 0;
      iframeStyle.width = "100%";
      iframeStyle.height = "100%";
      iframeStyle.border = 0;
      iframeStyle.margin = 0;
      iframeStyle.padding = 0;
  //    iframeStyle.width = "500px";
  
      widget.appendChild(iframe);
  
      //const greeting = script.getAttribute("data-greeting");
      const greeting = "Hello World";
      let url = script.getAttribute("data-url");
      if (!url) {
        url = "http://localhost:4000";
      }
  
      const api = {
        sendMessage: (message) => {
          iframe.contentWindow.postMessage(
            {
              sendMessage: message,
            },
            url
          );
        },
  
        show: () => {
          widget.style.display = "block";
        },
  
        hide: () => {
          widget.style.display = "none";
        },
  
        toggle: () => {
          const display = window.getComputedStyle(widget, null).display;
          widget.style.display = display === "none" ? "block" : "none";
        },
        maximixe: () => {
          widget.style.width = "550px";
      //    widget.style.height = "647px";
          widget.style.height = (window.innerHeight*0.6)+"px";
          widget.style.position = "fixed";
          widget.style.bottom = "0";
          widget.style.right = "0";
        },
        minimize: () => {
          widget.style.width = "60px";
          widget.style.height = "60px";
          widget.style.position = "fixed";
          widget.style.bottom = "40px";
          widget.style.right = "40px";
  
        },
        onHide: () => {},
      };
  
      iframe.addEventListener("load", () => {
        window.addEventListener("getWidgetApi", () => {
          const event = new CustomEvent("widgetApi", { detail: api });
          window.dispatchEvent(event);
        });
  
        window.addEventListener("message", (evt) => {
          if (evt.origin !== url) {
            return;
          }
          window.handleChatMessage(evt);
  
          if (evt.data === "hide") {
            api.hide();
            api.onHide();
          }
          if (evt.data === "maximize") {
            api.maximixe();
          }
          if (evt.data === "minimise") {
            api.minimize();
          }
        });
  
        iframe.contentWindow.postMessage({ greeting }, url);
        widgetStyle.display = "block";
      });
  
      iframe.src = url;
  
      document.body.appendChild(widget);
  
      window.removeChatWidget = () => {
        document.body.removeChild(widget);
      };
    };
  
    if (document.readyState === "complete") {
      loadWidget();
    } else {
      document.addEventListener("readystatechange", () => {
        if (document.readyState === "complete") {
          loadWidget();
        }
      });
    }
  })();
  