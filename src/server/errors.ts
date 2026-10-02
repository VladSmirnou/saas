class FakeUserError {
  #error = new Error('Fake user error');
  get error() {
    return this.#error;
  }
}

export { FakeUserError };
