const posts = ["streams.md", "streams copy.md"];

const postList = document.getElementById('post-list');
const blog_page = document.getElementById('blog_page');
const postContent = document.getElementById('post-content');
const homeSection = document.getElementById('start_page');
const homeButton = document.getElementById('home-button');
const sidebar = document.getElementById('sidebar');

async function fetchMarkdown(file) {
    const res = await fetch(`posts/${file}`);
    const text = await res.text();
    const [, frontMatter, md] = text.match(/---\n([\s\S]+?)\n---\n([\s\S]*)/) || [];
    return { metadata: jsyaml.load(frontMatter), md };
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
    const { metadata, md } = await fetchMarkdown(file);

    const date = metadata.date?.toLocaleDateString()

    postContent.innerHTML = `
        <div class="post-header">
            <h1>${metadata.title}</h1>
            ${metadata.sub_title ? `<h3>${metadata.sub_title}</h3>` : ''}
            <p class="meta">${metadata.author || 'Willem Vanhulle'}${ date ? ' | ' + date : ''}</p>
        </div>
        <div class="post-body">${marked.parse(md)}</div>
    `;
    hljs.highlightAll();

    homeSection.hidden = true;
    blog_page.hidden = false;


}

postList.onclick = e => {
    e.preventDefault();
    if (e.target.matches('a[data-file]')) showPost(e.target.dataset.file);
};



renderPostList();

homeButton.onclick = () => {
    homeSection.hidden = false;
    blog_page.hidden = true;
    postList.hidden = false;

};
