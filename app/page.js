import OrderForm from "./order-form";

const services = [
  {
    title: "Лендинг",
    text: "Одностраничный сайт для услуги, продукта или проекта.",
    price: "от 10 000 ₽"
  },
  {
    title: "Сайт для бизнеса",
    text: "Небольшой современный сайт с нужными разделами и заявками.",
    price: "от 20 000 ₽"
  },
  {
    title: "Доработка сайта",
    text: "Исправление дизайна, адаптива, скорости или функционала.",
    price: "по задаче"
  }
];

export default function Home() {
  return (
    <main>
      <header className="header shell">
        <a href="#top" className="brand">Eugene Code</a>
        <a href="#order" className="smallButton">Заказать сайт</a>
      </header>

      <section className="hero shell" id="top">
        <span className="label">РАЗРАБОТКА САЙТОВ</span>
        <h1>Делаю простые и современные сайты.</h1>
        <p>
          Лендинги, сайты для бизнеса и доработка существующих проектов.
          Без перегруженного дизайна и лишней сложности.
        </p>
        <div className="actions">
          <a href="#order" className="primary">Оставить заявку</a>
          <a href="#services" className="secondary">Посмотреть услуги</a>
        </div>
      </section>

      <section className="section shell" id="services">
        <div className="sectionTitle">
          <span className="label">УСЛУГИ</span>
          <h2>Что можно заказать</h2>
        </div>

        <div className="services">
          {services.map((service) => (
            <article className="service" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <strong>{service.price}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell">
        <div className="simpleBlock">
          <div>
            <span className="label">КАК РАБОТАЕМ</span>
            <h2>Всё максимально просто.</h2>
          </div>
          <div className="steps">
            <p><b>01.</b> Ты оставляешь заявку.</p>
            <p><b>02.</b> Обсуждаем задачу и цену.</p>
            <p><b>03.</b> Я делаю сайт и показываю результат.</p>
            <p><b>04.</b> Вносим правки и запускаем.</p>
          </div>
        </div>
      </section>

      <section className="section shell" id="order">
        <div className="order">
          <div className="orderText">
            <span className="label">ЗАКАЗ</span>
            <h2>Расскажи о своём проекте.</h2>
            <p>После отправки заявка сразу придёт мне в Telegram.</p>
          </div>

          <OrderForm />
        </div>
      </section>

      <footer className="footer shell">
        <span>Eugene Code</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
