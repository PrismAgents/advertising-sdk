

b:
	npm run build && \
	npm link

publish:
	git add . && \
	git commit -m "update" && \
	git push --follow-tags && \
	npm run build && \
	npm version patch && \
	npm publish

	