

b:
	npm run build && \
	npm link

publish:
	git add . && \
	git commit -m "update" && \
	git push && \
	npm version patch && \
	npm publish

	