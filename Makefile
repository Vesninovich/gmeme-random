NAME=dvesnin
DOMAIN=test0for.sber

BUILT_SCHEMAS = schemas/gschemas.compiled
ASSETS = metadata.json stylesheet.css

.PHONY: all pack install clean

all: dist/extension.js dist/prefs.js

dist/%.js: %.ts
	npx tsc

$(BUILT_SCHEMAS): schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	glib-compile-schemas schemas

assets: dist $(BUILT_SCHEMAS) $(ASSETS)
	mkdir -p dist/schemas
	cp $(BUILT_SCHEMAS) dist/schemas/
	cp $(ASSETS) dist

$(NAME).zip: assets
	(cd dist && zip ../$(NAME).zip -9r .)

pack: $(NAME).zip

install: all assets
	-rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	cp -rf dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)

clean:
	rm -rf dist $(NAME).zip