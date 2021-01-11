window.onload = () => {
  // PogChamp emote for chat
  const pog = document.createElement('img');
  pog.alt = 'PogChamp';
  pog.className = 'chat-image chat-line__message--emote';
  pog.src = chrome.runtime.getURL('images/128.png');

  // PogChamp for emote picker
  const pogPicker = pog.cloneNode();
  pogPicker.className = 'emote-picker__image';

  // PogChamp for emote card
  const bigPog = pog.cloneNode();
  bigPog.className = 'emote-card__big-emote tw-image';
  bigPog.setAttribute('data-test-selector', 'big-emote');

  // Card
  const runCard = () => {
    const cardHolder = document.querySelector(
      'div.tw-full-height.tw-full-width.tw-relative.tw-z-above.viewer-card-layer'
    );

    // Timeouts help with delay in loading, 50ms is arbitrary limit
    const waitForImage = (newNode, val) => {
      // Give up after ~50ms
      if (val === 49) {
        return;
      }
      setTimeout(() => {
        const emoteImg = newNode.getElementsByTagName('IMG')[0];
        if (emoteImg && emoteImg.getAttribute('alt') === 'PogChamp') {
          emoteImg.replaceWith(bigPog);
        } else {
          waitForImage(newNode, val++);
        }
      }, 1);
    };

    const cardObserver = new MutationObserver((muts, obs) => {
      muts.forEach((mut) => {
        if (mut.type === 'childList' && mut.addedNodes.length > 0) {
          waitForImage(mut.addedNodes[0], 0);
        }
      });
    });

    cardObserver.observe(cardHolder, { childList: true });
  };
  // End Card

  // Picker
  const runPicker = () => {
    const pickerParentBlock = document.querySelector(
      'div.tw-block.tw-relative.tw-z-default'
    );

    const swapPogButtons = (newNode) => {
      setTimeout(() => {
        const pogButtons = newNode.querySelectorAll(
          'button[name="PogChamp"]:not(.pogswap)'
        );
        if (pogButtons.length > 0) {
          for (let x = 0, l = pogButtons.length; x < l; x++) {
            const pbImg = pogButtons[x].children[0].children[0];
            pbImg.replaceWith(pogPicker.cloneNode());
            pbImg.className += 'pogswap'; // ensures we don't waste cycles on buttons that have been changed.
          }
        }
      }, 1);
    };

    const scrollObserver = new MutationObserver((muts, obs) => {
      muts.forEach((mut) => {
        if (mut.type === 'childList') {
          mut.addedNodes.forEach((node) => {
            swapPogButtons(node);
          });
        }
      });
    });

    const pickerObserver = new MutationObserver((muts, obs) => {
      muts.forEach((mut) => {
        if (mut.type === 'childList') {
          swapPogButtons(mut.addedNodes[0]);
          pickerObserver.disconnect();
          scrollObserver.observe(
            mut.addedNodes[0].getElementsByClassName(
              'simplebar-content emote-picker__scroll-container'
            )[0].children[0],
            { childList: true, subtree: true }
          );
        }
      });
    });

    pickerObserver.observe(pickerParentBlock, { childList: true });
  };
  // End Picker

  // Live Chat
  const runLive = () => {
    const chatList = document.getElementsByClassName(
      'chat-scrollable-area__message-container'
    )[0];

    const getAndSwapEmotes = (chatMessage) => {
      const emotes = chatMessage.getElementsByClassName(
        'chat-line__message--emote-button'
      );
      for (let x = 0, l = emotes.length; x < l; x++) {
        const img = emotes[x].children[0].children[0].children[0];
        if (img.alt === 'PogChamp') img.replaceWith(pog.cloneNode());
      }
    };

    const chatObserver = new MutationObserver((muts, observer) => {
      muts.forEach((mut) => {
        if (mut.type === 'childList' && mut.addedNodes.length > 0) {
          mut.addedNodes.forEach((node) => {
            getAndSwapEmotes(node);
          });
        }
      });
    });

    runPicker();

    chatObserver.observe(chatList, { childList: true });
    // Get messages that had already loaded.
    // Preload may catch messages already read by the observer, but this is minor and ensures no messages are missed.
    for (let x = 0, preload = chatList.children.length; x < preload; x++) {
      getAndSwapEmotes(chatList.children[x]);
    }

    runCard();
  };
  // End Live

  // VOD Chat : Entirely different from Live Chat for some reason
  const vodChatLoaded = (vodChat) => {
    const getAndSwapVodEmotes = (chatMessage) => {
      const emotes = chatMessage.getElementsByClassName(
        'chat-image__container'
      );
      for (let x = 0, l = emotes.length; x < l; x++) {
        const img = emotes[x].children[0];
        if (img.alt === 'PogChamp') img.replaceWith(pog.cloneNode());
      }
    };

    const vodChatObserver = new MutationObserver((muts, obs) => {
      muts.forEach((mut) => {
        if (mut.type === 'childList' && mut.addedNodes.length > 0) {
          mut.addedNodes.forEach((node) => {
            getAndSwapVodEmotes(node);
          });
        }
      });
    });

    vodChatObserver.observe(vodChat, { childList: true });
    for (let x = 0, preload = vodChat.children.length; x < preload; x++) {
      getAndSwapVodEmotes(vodChat.children[x]);
    }
  };

  const runVod = () => {
    const vodChatParent = document.getElementsByClassName(
      'video-chat__message-list-wrapper'
    )[0].children[0];

    const vodWaitForLoadObserver = new MutationObserver((muts, obs) => {
      muts.forEach((mut) => {
        if (mut.type === 'childList') {
          if (vodChatParent.firstElementChild.tagName === 'UL') {
            vodWaitForLoadObserver.disconnect();
            vodChatLoaded(vodChatParent.firstElementChild);
          }
        }
      });
    });

    if (vodChatParent.firstElementChild.tagName === 'UL') {
      vodChatLoaded(vodChatParent.firstElementChild);
    } else {
      vodWaitForLoadObserver.observe(vodChatParent, { childList: true });
    }
  };

  if (window.location.pathname.split('/')[1] === 'videos') {
    runVod();
  } else {
    runLive();
  }
  // TODO Fix broken tooltip when swapping image
  // TODO Add configuration for the timeouts
};
