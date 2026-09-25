# devbox interactive shell.
#   ~/.config/zsh/conf.d/   Oh My Zsh libraries and devbox overrides, loaded alphabetically
#   ~/.config/zsh/plugins/  every plugin directory here is loaded

[[ -r "${ZDOTDIR:-$HOME}/.zprofile" ]] && source "${ZDOTDIR:-$HOME}/.zprofile"
[[ -o interactive ]] || return

export ZSH_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/zsh"
export ZSH_PLUGINS="$ZSH_CONFIG/plugins"
export ZSH_CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/zsh"

# Oh My Zsh libraries read these without the framework loader.
export ZSH="$ZSH_CONFIG"
export ZSH_CUSTOM="$ZSH_CONFIG"
export CASE_SENSITIVE=true

mkdir -p "$ZSH_CACHE_DIR"

plugin_dirs=("$ZSH_PLUGINS"/*(N/))
fpath=(/usr/local/share/zsh/site-functions $plugin_dirs $fpath)

autoload -Uz colors compinit
colors
compinit -d "$ZSH_CACHE_DIR/zcompdump"

# Opt a file out of its aliases with, for example: zstyle ':omz:plugins:git' aliases no
_zsh_source() {
  local filepath="$1" context alias_setting disable_aliases=0

  case "$filepath" in
    "$ZSH_CONFIG"/conf.d/*) context="lib:${filepath:t:r}" ;;
    "$ZSH_PLUGINS"/*/*) context="plugins:${filepath:h:t}" ;;
    *) context="$filepath" ;;
  esac

  if zstyle -s ":omz:${context}" aliases alias_setting && [[ "$alias_setting" == no ]]; then
    disable_aliases=1
  fi

  local -A aliases_pre galiases_pre
  if (( disable_aliases )); then
    aliases_pre=("${(@kv)aliases}")
    galiases_pre=("${(@kv)galiases}")
  fi

  [[ -r "$filepath" ]] && source "$filepath"

  if (( disable_aliases )); then
    if (( #aliases_pre )); then
      aliases=("${(@kv)aliases_pre}")
    else
      (( #aliases )) && unalias "${(@k)aliases}"
    fi
    if (( #galiases_pre )); then
      galiases=("${(@kv)galiases_pre}")
    else
      (( #galiases )) && unalias "${(@k)galiases}"
    fi
  fi
}

for conf_file ("$ZSH_CONFIG"/conf.d/*.zsh(N)); do
  _zsh_source "$conf_file"
done

for plugin_dir ($plugin_dirs); do
  _zsh_source "$plugin_dir/${plugin_dir:t}.plugin.zsh"
done
unset conf_file plugin_dir plugin_dirs

# Syntax highlighting wraps widgets defined above, so it loads last.
for plugin_file (
  /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
  /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
); do
  if [[ -r "$plugin_file" ]]; then
    _zsh_source "$plugin_file"
    break
  fi
done
unset plugin_file
