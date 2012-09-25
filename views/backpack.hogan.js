<div class="row backpack">
  <div class="span8 column badges">
  
    <header>
      <div class="title">Badges</div>
      <div class="addendum">Looking a bit bare? <a href="badges!">Earn more badges!</a></div>
    </header>

    <div class="collection">
      <div class="badge">b</div>
      <div class="badge">a</div>
      <div class="badge">d</div>
      <div class="badge">g</div>
      <div class="badge">e</div>
      <div class="badge">s</div>
      <div class="badge">!</div>
      <div class="badge">b</div>
      <div class="badge">a</div>
      <div class="badge">d</div>
      <div class="badge">g</div>
      <div class="badge">e</div>
      <div class="badge">s</div>
      <div class="badge">!</div>
    </div>
    
    <div class="footer">
     <p>badge footer. With toes (also, an <span class="btn">upload</span> button)</p>
    </div>
  </div>
  
  <div class="span4 column groups">
    <section>
      <header>
        <div class="title">Groups</div>
      </header>
      
      <ul>
        <li>Placeholder</li>
        <li>Another Placeholder</li>
      </ul>
    </section>

    <section>
      <header>
        <div class="title">Tags</div>
      </header>

      <ul>
        <li>Tag</li>
        <li>Another tag</li>
        <li>Lolcat</li>
        <li>Badges</li>
      </ul>      
    <section>

  </div>
</div>

<style>

  html {
    background: none;
  }

  body {
    background: #EEE;
  }

  .backpack header {
    width: 100%;
    /* larges font size is 220% */
    height: 2.2em;
  }
  
  .backpack header .title {
    font-size: 220%;
    font-weight: bold;
  }

  .backpack header .title {
    float: left;
  }

  .backpack header .addendum {
    float: right;
    font-weight: bold;
    line-height: 2.2em;
  }

  .backpack header .addendum a {
    color: black;
    text-decoration: underline;
  }
  
  .badges .collection {
    background: white;
    border-radius: 15px;
    padding-top: 20px;
    margin: 1em 0;
    line-height: 120px;
  }

  .backpack .footer h1 {
    font-size: 200%;
  }
  
  .badges p {
    font-weight: bold;
    margin: 0;
    padding: 0;
  }

  .badges p+p {
    margin-top: 1em;
  }
  
  .badges .badge {
    padding: 0; /* override */;
    width: 110px;
    height: 110px;
    margin: 0 20px;
    border-radius: 100px;
    border: 1px solid #494949;
    display: inline-block;
    background: #d6d6d6;
    text-align: center;

    /* TESTING ONLY */
    color: white;
    font-size: 100px;
    line-height: 100px;
  }
  
  .groups section + section {
    margin-top: 3em;
  }

  .groups ul {
    margin-top: 1em;
  }
</style>