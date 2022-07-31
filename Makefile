SRC := ./extension
DIST := ./dist
ZIP := $(shell which zip)

PACKAGE_NAME := chrome-skk
PACKAGE_VERSION := $(shell node -e "fs=require('fs');console.log(JSON.parse(fs.readFileSync(process.argv[1])).version)" ./extension/manifest.json)
NODE_MODULES := ../node_modules

build:
	rm -rf $(DIST); \
	mkdir -p $(DIST); \
	cd $(SRC); \
	find . -type f -print | $(ZIP) ../$(DIST)/$(PACKAGE_NAME)-$(PACKAGE_VERSION).zip -@; \
        $(ZIP) ../$(DIST)/$(PACKAGE_NAME)-$(PACKAGE_VERSION).zip -j $(NODE_MODULES)/pako/dist/pako_inflate.es5.min.js;

clean:
	rm -rf $(DIST)
