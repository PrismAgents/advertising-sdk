b:
	npm run build && \
	npm link

publish:
	npm publish

patch:
	npm version patch

minor:
	npm version minor

major:
	npm version major
	