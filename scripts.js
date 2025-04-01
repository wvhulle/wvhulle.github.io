const posts = ["streams.md"];

const postList = document.getElementById('post-list');
const blog_page = document.getElementById('blog_page');
const postContent = document.getElementById('post-content');
const homeSection = document.getElementById('start_page');
const homeButton = document.getElementById('home-button');
const sidebar = document.getElementById('sidebar');

async function fetchMarkdown(file) {
    const relative_url = `posts/${file}`;
    try {
        const res = await fetch(relative_url);
        try {
            const text = await res.text();
            const [, frontMatter, md] = text.match(/---\n([\s\S]+?)\n---\n([\s\S]*)/) || [];
            return { metadata: jsyaml.load(frontMatter), md };
        } catch (e) {
            console.error(`A request response wasreturned from ${relative_url} does not contain any text.`);
        }

    } catch (e) {
        console.error(`Not found file available at ${relative_url}. Make sure that the markdown file names in the scripts.js are correct.`);
    }



}

async function renderPostList() {

    for (const file of posts) {
        const { metadata } = await fetchMarkdown(file);
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-file="${file}">${metadata.title}</a>`;
        postList.appendChild(li);
    }
}

async function showPost(file) {
    console.log(`Showing post ${file}`)
    const { metadata, md } = await fetchMarkdown(file);

    const date = metadata.date?.toLocaleDateString()

    postContent.innerHTML = `
        <div class="post-header">
            <h1>${metadata.title}</h1>
            ${metadata.sub_title ? `<h3>${metadata.sub_title}</h3>` : ''}
            <p id="meta">${metadata.author || 'Willem Vanhulle'}${date ? ' | ' + date : ''}</p>
        </div>
        <div class="post-body">${marked.parse(md)}</div>
    `;
    hljs.highlightAll();

    console.log(`Hiding home section`)
    homeSection.hidden = true;
    blog_page.hidden = false;

    await create_anchor_tags();
}

async function create_anchor_tags() {
    const anchors = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const anchor of anchors) {
        const id = anchor.innerText.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9\-_]+/g, '');
        anchor.id = id;
        anchor.innerHTML += `<a href="#${id}" class="anchor"></a>`;
    }
}



async function main() {
    await renderPostList();

    homeButton.onclick = () => {
        console.log(`Home button clicked`);
        homeSection.hidden = false;
        blog_page.hidden = true;

    };

    postList.onclick = e => {
        e.preventDefault();
        if (e.target.matches('a[data-file]')) showPost(e.target.dataset.file);
    };




}

main();