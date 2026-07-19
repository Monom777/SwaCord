    case 'server_mode':
      const changed = (state.serverMode !== data.enabled);
      state.serverMode = data.enabled; 
      if (changed && !state.isHost) {
        // Clear existing local chat and fetch correct history
        DOM.messagesWrap.innerHTML = '';
        if (state.serverMode) {
          fetchVercelChatHistory();
        } else {
          loadChatHistory();
        }
      }
      break;
