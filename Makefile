

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

publish-minor:
	git add . && \
	git commit -m "feat: add auto-initialization and enhanced error handling" && \
	git push --follow-tags && \
	npm run build && \
	npm version minor && \
	npm publish

publish-major:
	git add . && \
	git commit -m "breaking: major version update" && \
	git push --follow-tags && \
	npm run build && \
	npm version major && \
	npm publish
	